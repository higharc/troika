import assert from 'node:assert/strict'
import {test} from 'node:test'
import {CPUAtlas} from '../src/CPUAtlas.js'

test('CPU glyphs preserve independent RGBA channels and survive atlas growth', () => {
  const atlas = new CPUAtlas(32, 16)
  const path = 'M4,4L12,4L12,12L4,12Z'
  for (let channel = 0; channel < 4; channel++) {
    atlas.generateGlyph(16, path, [0, 0, 16, 16], 16, 9, 0, 0, channel)
    assert.ok(atlas.data[(8 * 32 + 8) * 4 + channel] > 128)
    assert.ok(atlas.data[channel] < 128)
    for (let unused = channel + 1; unused < 4; unused++) {
      assert.equal(atlas.data[(8 * 32 + 8) * 4 + unused], 0)
    }
  }
  const before = atlas.data.slice()
  atlas.grow(64)
  atlas.generateGlyph(16, path, [0, 0, 16, 16], 16, 9, 16, 32, 2)
  assert.deepEqual(atlas.data.slice(0, before.length), before)
  assert.ok(atlas.data[(40 * 32 + 24) * 4 + 2] > 128)
  assert.equal(atlas.data[(40 * 32 + 24) * 4 + 3], 0)
  const grown = atlas.data
  atlas.grow(32)
  assert.equal(atlas.data, grown)
});
