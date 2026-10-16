import * as THREE from "three";
import type { Anchor } from "@/data/parts";
import { buildAirliner, type AirlinerModel, type Piece, type Pivot } from "./model";
import { PALETTE, makeBlueprintMaterial, makeLineMaterial, makeMaskedLineMaterial, makeSolidMaterial } from "./materials";

/** Per-anchor look. Every value is 0..1 and is eased toward each frame. */
export type AnchorLook = {
  /** Solid (painted / metal) rendering. */
  solid: number;
  /** Blueprint drawing (fill + rim + lines). */
  bp: number;
  /** Paper fill opacity of the drawing. */
  fill: number;
  /** Internals: show fully (not only under the brush). */
  reveal: number;
  /** Accent highlight on solids. */
  highlight: number;
};

const DEFAULT_LOOK: AnchorLook = { solid: 1, bp: 0, fill: 0.92, reveal: 0, highlight: 0 };

type AnchorCtl = {
  id: Anchor;
  solidPlane: THREE.Plane;
  bpPlane: THREE.Plane;
  solidMats: THREE.MeshPhysicalMaterial[];
  bpSkin: THREE.ShaderMaterial;
  bpInternal: THREE.ShaderMaterial;
  lines: THREE.LineBasicMaterial;
  linesInternal: THREE.ShaderMaterial;
  look: AnchorLook;
  hasSkin: boolean;
};

type Item = {
  piece: Piece;
  group: THREE.Group;
  solid: THREE.Mesh;
  bp: THREE.Mesh;
  lines: THREE.LineSegments;
  base: THREE.Vector3;
  phase: number;
  /** Small parts grow while exploded so they read as products next to a 38 m airframe. */
  hero: number;
};

const accent = new THREE.Color(PALETTE.accent);
const tmpColor = new THREE.Color();

export class AirlinerRig {
  readonly root = new THREE.Group();
  readonly model: AirlinerModel;
  readonly anchors = new Map<Anchor, AnchorCtl>();
  readonly items: Item[] = [];
  readonly pickables: THREE.Mesh[] = [];
  private pivotGroups = {} as Record<Pivot, THREE.Group>;

  /** 1 = gear down, 0 = retracted */
  gear = 1;
  explode = 0;
  /** World z of the blueprint scan line, or null when not scanning. */
  scan: number | null = null;
  fanSpeed = 0;
  bob = 1;
  private fanAngle = 0;

  constructor() {
    this.model = buildAirliner();
    this.root.name = "airliner";

    for (const [pivot, pos] of Object.entries(this.model.pivots) as [Pivot, THREE.Vector3][]) {
      const g = new THREE.Group();
      g.position.copy(pos);
      this.pivotGroups[pivot] = g;
      this.root.add(g);
    }

    const solidCache = new Map<string, THREE.MeshPhysicalMaterial>();
    this.model.pieces.forEach((piece, i) => {
      const ctl = this.ensureAnchor(piece.anchor);
      if (!piece.internal) ctl.hasSkin = true;

      const key = `${piece.anchor}:${piece.kind}`;
      let solidMat = solidCache.get(key);
      if (!solidMat) {
        solidMat = makeSolidMaterial(piece.kind, ctl.solidPlane);
        solidCache.set(key, solidMat);
        ctl.solidMats.push(solidMat);
      }

      const group = new THREE.Group();
      group.name = piece.name;
      const solid = new THREE.Mesh(piece.geometry, solidMat);
      solid.userData.anchor = piece.anchor;
      solid.userData.piece = piece.name;
      const bp = new THREE.Mesh(piece.geometry, piece.internal ? ctl.bpInternal : ctl.bpSkin);
      bp.renderOrder = piece.internal ? 2 : 1;
      const lineGeo = piece.lines ?? new THREE.EdgesGeometry(piece.geometry, 28);
      const lines = new THREE.LineSegments(lineGeo, piece.internal ? ctl.linesInternal : ctl.lines);
      lines.renderOrder = piece.internal ? 4 : 3;
      group.add(solid, bp, lines);

      const parent = piece.pivot ? this.pivotGroups[piece.pivot] : this.root;
      const base = piece.origin.clone();
      if (piece.pivot) base.sub(this.model.pivots[piece.pivot]);
      group.position.copy(base);
      parent.add(group);

      piece.geometry.computeBoundingBox();
      const size = piece.geometry.boundingBox!.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const hero = THREE.MathUtils.clamp(3.2 / Math.max(maxDim, 0.01), 1, 2.4);
      this.items.push({ piece, group, solid, bp, lines, base, phase: i * 1.731, hero });
      this.pickables.push(solid);
    });
  }

  private ensureAnchor(id: Anchor): AnchorCtl {
    let ctl = this.anchors.get(id);
    if (ctl) return ctl;
    const solidPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 1e4);
    const bpPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e4);
    ctl = {
      id,
      solidPlane,
      bpPlane,
      solidMats: [],
      bpSkin: makeBlueprintMaterial(false, bpPlane),
      bpInternal: makeBlueprintMaterial(true, bpPlane),
      lines: makeLineMaterial(bpPlane),
      linesInternal: makeMaskedLineMaterial(bpPlane),
      look: { ...DEFAULT_LOOK },
      hasSkin: false,
    };
    this.anchors.set(id, ctl);
    return ctl;
  }

  /** Jump every anchor straight to a look (no easing). */
  snap(look: (a: Anchor) => Partial<AnchorLook>) {
    for (const ctl of this.anchors.values()) Object.assign(ctl.look, DEFAULT_LOOK, look(ctl.id));
  }

  /**
   * Advance one frame.
   * @param target desired look per anchor
   * @param ease 0..1 easing factor for this frame
   */
  update(dt: number, time: number, target: (a: Anchor) => Partial<AnchorLook>, ease: number) {
    // Clipping planes for the scan conversion (solid ahead of the line, drawing behind it).
    const s = this.scan;
    for (const ctl of this.anchors.values()) {
      ctl.solidPlane.constant = s === null ? 1e4 : -s;
      ctl.bpPlane.constant = s === null ? 1e4 : s;

      const t = { ...DEFAULT_LOOK, ...target(ctl.id) };
      const l = ctl.look;
      l.solid += (t.solid - l.solid) * ease;
      l.bp += (t.bp - l.bp) * ease;
      l.fill += (t.fill - l.fill) * ease;
      l.reveal += (t.reveal - l.reveal) * ease;
      l.highlight += (t.highlight - l.highlight) * ease;

      for (const m of ctl.solidMats) {
        m.opacity = m.userData.baseOpacity * l.solid;
        m.visible = l.solid > 0.01;
        m.depthWrite = l.solid > 0.97 && m.userData.baseOpacity >= 1;
        tmpColor.copy(m.userData.baseEmissive).lerp(accent, l.highlight);
        m.emissive.copy(tmpColor);
        m.emissiveIntensity = THREE.MathUtils.lerp(m.userData.baseEmissiveIntensity, 0.55, l.highlight);
      }
      const show = l.bp > 0.01;
      ctl.bpSkin.visible = show;
      ctl.bpSkin.uniforms.uLineOpacity.value = l.bp;
      ctl.bpSkin.uniforms.uFillOpacity.value = l.fill * l.bp;
      ctl.bpInternal.visible = show;
      ctl.bpInternal.uniforms.uLineOpacity.value = l.bp;
      ctl.bpInternal.uniforms.uReveal.value = l.reveal;
      ctl.lines.visible = show;
      ctl.lines.opacity = l.bp * 0.85;
      ctl.linesInternal.visible = show;
      ctl.linesInternal.uniforms.uLineOpacity.value = l.bp;
      ctl.linesInternal.uniforms.uReveal.value = l.reveal * 0.6;
    }

    // Gear retraction.
    const g = (1 - this.gear) * (Math.PI / 2);
    this.pivotGroups.gearR.rotation.z = -g;
    this.pivotGroups.gearL.rotation.z = g;
    this.pivotGroups.gearN.rotation.x = g;

    this.fanAngle += dt * this.fanSpeed;
    const e = this.explode;
    for (const it of this.items) {
      const { piece, group } = it;
      const bob = e * this.bob;
      group.position.set(
        it.base.x + piece.explode.x * e,
        it.base.y + piece.explode.y * e + Math.sin(time * 0.7 + it.phase) * 0.22 * bob,
        it.base.z + piece.explode.z * e,
      );
      group.rotation.set(Math.sin(time * 0.45 + it.phase) * 0.05 * bob, 0, Math.cos(time * 0.38 + it.phase) * 0.05 * bob);
      group.scale.setScalar(1 + (it.hero - 1) * e);
      if (piece.gearDoor) group.visible = this.gear > 0.35;
      if (piece.spin) {
        it.solid.rotation.z = this.fanAngle;
        it.bp.rotation.z = this.fanAngle;
        it.lines.rotation.z = this.fanAngle;
      }
    }
  }

  /** Assembled (non-exploded) centre and radius of the given anchors. */
  focusOf(anchors: Anchor[]) {
    const box = new THREE.Box3();
    for (const a of anchors) {
      const b = this.model.bounds.get(a);
      if (b) box.union(b);
    }
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    return { center, radius: Math.max(size.x, size.y, size.z) / 2 };
  }

  /** World-space centre of an anchor in its current (possibly exploded) state. */
  anchorWorldCenter(anchor: Anchor, out = new THREE.Vector3()) {
    const box = new THREE.Box3();
    for (const it of this.items) if (it.piece.anchor === anchor) box.expandByObject(it.solid);
    return box.getCenter(out);
  }

  dispose() {
    for (const it of this.items) {
      it.piece.geometry.dispose();
      it.lines.geometry.dispose();
    }
    for (const ctl of this.anchors.values()) {
      ctl.solidMats.forEach((m) => m.dispose());
      ctl.bpSkin.dispose();
      ctl.bpInternal.dispose();
      ctl.lines.dispose();
      ctl.linesInternal.dispose();
    }
  }
}
