import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {test} from 'node:test'
import {IntType, MeshBasicMaterial, Texture} from 'three'
import {MeshBasicNodeMaterial} from 'three/webgpu'

globalThis.self = globalThis
const require = createRequire(import.meta.url)
const {Text} = require('../dist/troika-three-text.webgpu.umd.js')

function prepare(text) {
  text.fontSize = 1
  text._textRenderInfo = {
    sdfTexture: new Texture({width: 2048, height: 2048}),
    sdfGlyphSize: 256,
    sdfExponent: 9,
    blockBounds: [0, 0, 2, 1]
  }
  text._needsSync = false
  for (const material of [].concat(text.material)) {
    text._prepareForRender(material)
  }
}

test('outline and fill own their colors, uniforms, identities, and listeners', () => {
  const text = new Text()
  text.material = new MeshBasicNodeMaterial()
  text.forceDefaultMaterialForOutlines = false
  text.outlineWidth = 0.1
  text.outlineColor = 0
  text.color = 0xff0000
  prepare(text)
  const [outline, fill] = text.material
  assert.notEqual(outline.uuid, fill.uuid)
  assert.notEqual(outline.color, fill.color)
  assert.notEqual(outline.uniforms.uTroikaEdgeOffset, fill.uniforms.uTroikaEdgeOffset)
  assert.equal(outline.color.getHex(), 0)
  assert.equal(fill.color.getHex(), 0xff0000)
  assert.equal(outline.uniforms.uTroikaEdgeOffset.value, 0.1)
  assert.equal(fill.uniforms.uTroikaEdgeOffset.value, 0)
  assert.equal(outline.colorNode, fill.colorNode)
  text.dispose()
})

test('default outlines use node materials and omit custom fill nodes', () => {
  const text = new Text()
  const base = new MeshBasicNodeMaterial()
  base.outputNode = {isNode: true}
  text.material = base
  text.outlineWidth = 0.1
  const [outline, fill] = text.material
  assert.equal(outline.isNodeMaterial, true)
  assert.equal(outline.outputNode, null)
  assert.equal(fill.outputNode, base.outputNode)
  text.dispose()
})

test('alternating text orientations retain independent per-material matrices', () => {
  const first = new Text()
  const second = new Text()
  first.orientation = '+x+z'
  prepare(first)
  const expected = first.material.uniforms.uTroikaOrient.value.toArray()
  prepare(second)
  prepare(first)
  assert.deepEqual(first.material.uniforms.uTroikaOrient.value.toArray(), expected)
  assert.notDeepEqual(second.material.uniforms.uTroikaOrient.value.toArray(), expected)
  assert.equal(first.material.colorNode, second.material.colorNode)
  first.dispose()
  second.dispose()
})

test('disposing one text releases its materials and base listener without disposing siblings', () => {
  const base = new MeshBasicNodeMaterial()
  const first = new Text()
  const second = new Text()
  first.material = second.material = base
  first.outlineWidth = second.outlineWidth = 0.1
  const firstMaterials = first.material
  const secondMaterials = second.material
  const disposed = []
  for (const material of [...firstMaterials, ...secondMaterials, base]) {
    material.addEventListener('dispose', () => disposed.push(material))
  }
  let meshDisposed = false
  first.addEventListener('dispose', () => { meshDisposed = true })
  const listeners = base._listeners.dispose.length
  first.dispose()
  assert.equal(meshDisposed, true)
  assert.equal(base._listeners.dispose.length, listeners - 1)
  assert.equal(disposed.length, 2)
  assert(firstMaterials.every(material => disposed.includes(material)))
  second.dispose()
  assert.equal(disposed.length, 4)
})

test('cached geometry preserves integer indices and starts with no draw', () => {
  const text = new Text()
  assert.equal(text.geometry.drawRange.count, 0)
  text.geometry.updateGlyphs(new Float32Array([0, 0, 2, 1]), new Uint16Array([3]), [0, 0, 2, 1], null, null)
  assert.equal(text.geometry.getAttribute('aTroikaGlyphIndex').gpuType, IntType)
  assert.equal(text.geometry.instanceCount, 1)
  text.dispose()
})

test('classic custom materials are rejected instead of silently drawing undecorated quads', () => {
  const text = new Text()
  text.material = new MeshBasicMaterial()
  assert.throws(() => text.material, /requires a NodeMaterial/)
  text.dispose()
})
