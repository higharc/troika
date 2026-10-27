import createSDFGenerator from 'webgl-sdf-generator'

const generate = /*#__PURE__*/ createSDFGenerator().javascript.generate

/** Raw RGBA storage preserves all four independent glyph channels without canvas alpha conversion. */
export class CPUAtlas {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.data = new Uint8Array(width * height * 4)
  }

  grow(height) {
    if (height > this.height) {
      const data = new Uint8Array(this.width * height * 4)
      data.set(this.data)
      this.data = data
      this.height = height
    }
  }

  generateGlyph(size, path, viewBox, distance, exponent, x, y, channel) {
    const glyph = generate(size, size, path, viewBox, distance, exponent)
    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        this.data[((y + row) * this.width + x + column) * 4 + channel] = glyph[row * size + column]
      }
    }
  }
}
