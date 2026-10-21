# Higharc Troika fork

Provisional package: `troika-three-text@0.53.0-higharc.0`.
Keep this version while iterating before merge; rebuild and refresh the product
lockfile when replacing its tarball. Do not publish an immutable tag until the
integration is accepted.

Based on upstream 0.53.0 (`a24a359`) plus PR #393 (`0f04ef3`). Retains Higharc's
FontKit/hhea metric selection, minimum line width, unhighlighted default outlines,
and mesh disposal event. The SDF generator dependency is unchanged.

## Node entry

Import `Text`, `configureTextBuilder`, and `preloadFont` from
`troika-three-text/webgpu`. The classic and node builds have separate builders;
configuration and preloads must use the same entry as the text meshes.
Both ESM and CommonJS node entries are included.

Custom bases must be node materials. Their graphs and properties are cloned when
the derived material is created; color inheritance is refreshed during rendering
when `Text.color` is unset. Updating other base properties after derivation does
not update the clone: update the derived material or replace the base.

Fill and outline passes own separate node-material instances and uniform values.
Graphs are shared via material references. `forceDefaultMaterialForOutlines`
selects a plain node base for the outline, omitting custom fill output/vertex
nodes. Copy pass-specific stencil policy to both materials when needed.
Disposing node text releases its geometry, derived materials, and default base;
an externally supplied base remains owned by the caller.

The node entry still generates SDFs through WebGL and reads the atlas back for
upload. It does not include `BatchedText` or custom depth/distance materials for
shadow casting.

## Build and validate

From the fork root, with the product's Higharc Three.js runtime available in a
parent `node_modules` (the fork's mesh-disposal patch uses that runtime):

```sh
npm ci --ignore-scripts --no-audit --no-fund
export LERNA_ROOT_PATH="$PWD"
(cd packages/troika-three-text && LERNA_PACKAGE_NAME=troika-three-text ../../node_modules/.bin/rollup -c "$LERNA_ROOT_PATH/rollup.config.js")
npm --prefix packages/troika-three-text run test:higharc
(cd packages/troika-three-text && npm pack --ignore-scripts --pack-destination /path/to/product/platform/packages/custom)
```

`test:higharc` tests the built CommonJS entry, outline ownership, per-material
orientation/bindings, program-graph sharing, cache hydration, and disposal.
Product rendering tests cover the installed artifact, selection/isolation,
stencil masks, layout caching, shader reuse, and font/PDF baselines.

The upstream Jest suites need their sibling packages bootstrapped and the
upstream React 16 development dependency; accidentally resolving the product's
React 19 changes React-element descriptors in the unrelated facade tests.
