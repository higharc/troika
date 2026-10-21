import { Color, DoubleSide, IntType } from 'three'
import { Text } from "../Text.js";
import { enableSDFAtlasReadback } from '../TextBuilder.js'
import { createTextDerivedNodeMaterial } from './TextDerivedNodeMaterial.js'
import { MeshBasicNodeMaterial } from "three/webgpu";

const defaultMaterialWebGPU = /*#__PURE__*/ new MeshBasicNodeMaterial({
  color: 0xffffff,
  side: DoubleSide,
  transparent: true
})

/**
 * @class WebGPUText
 *
 * Variant of the Text class that uses materials compatible with THREE.WebGPURenderer.
 */
class WebGPUText extends Text {

  constructor() {
    super()
    // The TSL shader reads the glyph index as an integer; rebuild the (still empty) attribute
    // with that binding before anything renders.
    this.geometry.glyphIndexGpuType = IntType
    this.geometry.updateGlyphs(new Float32Array(), new Uint16Array(), [], [], new Uint8Array())
    // updateGlyphs opens the draw range; like GlyphsGeometry, draw nothing until the first sync.
    this.geometry.setDrawRange(0, 0)
    enableSDFAtlasReadback()
  }

  _prepareForRender(material) {
    super._prepareForRender(material)
    // With no `color` set, Text deletes the derived material's own color so that it inherits the
    // base material's through the prototype chain. This derived material is a plain clone, with
    // no chain to inherit through, so the shader would read no color at all and render black.
    // Copy the base's color back in, into one reused Color rather than a new one every frame.
    const base = material.baseMaterial
    if (material.color === undefined && base && base.color) {
      if (!material._troikaInheritedColor) material._troikaInheritedColor = new Color()
      material.color = material._troikaInheritedColor.copy(base.color)
    }
  }

  /**
   * Create the text derived material from the base material. Can be overridden to use a custom
   * derived material.
   */
  createDerivedMaterial(baseMaterial) {
    return createTextDerivedNodeMaterial(baseMaterial)
  }

  createDefaultMaterial() {
    return defaultMaterialWebGPU.clone()
  }

  createOutlineMaterial(derivedMaterial) {
    const base = this.forceDefaultMaterialForOutlines
      ? this._defaultMaterial || (this._defaultMaterial = this.createDefaultMaterial())
      : derivedMaterial.baseMaterial
    // Node renderers attach mutable bindings to materials; an outline cannot prototype its fill.
    return this.createDerivedMaterial(base)
  }

  dispose() {
    super.dispose()
    if (this._derivedMaterial) {
      this._derivedMaterial.dispose()
    }
    if (this._defaultMaterial) {
      this._defaultMaterial.dispose()
    }
  }
}


export {
  WebGPUText
}
