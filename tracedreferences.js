function le(e, t, n, r, i) {
    const o = r ? e.seed.add(r) : e.seed;
    if (i === "java" || e.edition === h.Java && i !== "bedrock") {
        const s = new ge(o)
          , a = V.fromInt(t).multiply(s.nextLong())
          , c = V.fromInt(n).multiply(s.nextLong());
        return s.setSeed(a.xor(c).xor(o)),
        s
    } else {
        const s = new ee(o)
          , a = V.fromInt(t).multiply(s.nextInt())
          , c = V.fromInt(n).multiply(s.nextInt());
        return s.setSeed(a.xor(c).xor(o)),
        s
    }
}
let nn;
try {
    nn = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11])),{}).exports
} catch {}
function Ei(e) {
    e.low = -e.low & -1,
    e.high = ~e.high,
    e.low === 0 && (e.high = e.high + 1 & -1)
}
function Ne(e, {x: t, z: n}) {
    return t >= e.x && t < e.x + e.sizeX && n >= e.z && n < e.z + e.sizeZ
}
function rn(e, t) {
    const n = e.high >>> 16
      , r = e.high & 65535
      , i = e.low >>> 16
      , o = e.low & 65535
      , s = t.high >>> 16
      , a = t.high & 65535
      , c = t.low >>> 16
      , l = t.low & 65535;
    let u = 0
      , d = 0
      , f = 0
      , _ = 0;
    _ += o + l,
    f += _ >>> 16,
    _ &= 65535,
    f += i + c,
    d += f >>> 16,
    f &= 65535,
    d += r + a,
    u += d >>> 16,
    d &= 65535,
    u += n + s,
    u &= 65535,
    e.low = f << 16 | _,
    e.high = u << 16 | d
}
function Vi(e, t) {
    if (e.isZero())
        return;
    if (nn) {
        e.low = nn.mul(e.low, e.high, t.low, t.high),
        e.high = nn.get_high();
        return
    }
    let n, r, i, o, s, a, c, l, u, d, f, _, p;
    if (e.low === 0 && e.high === -2147483648) {
        (t.low & 1) === 0 && (e.high = 0);
        return
    } else if (t.low === 0 && t.high === -2147483648) {
        (e.low & 1) === 0 && (e.high = 0);
        return
    } else
        p = !1,
        e.high < 0 && (Ei(e),
        p = !p),
        t.high < 0 && (t = t.negate(),
        p = !p),
        n = e.low & 65535,
        r = e.low >>> 16,
        i = e.high & 65535,
        o = e.high >>> 16,
        s = t.low & 65535,
        a = t.low >>> 16,
        c = t.high & 65535,
        l = t.high >>> 16,
        u = d = f = _ = 0,
        u += n * s,
        d += u >>> 16,
        u &= 65535,
        d += r * s,
        f += d >>> 16,
        d &= 65535,
        d += n * a,
        f += d >>> 16,
        d &= 65535,
        f += i * s,
        _ += f >>> 16,
        f &= 65535,
        f += r * a,
        _ += f >>> 16,
        f &= 65535,
        f += n * c,
        _ += f >>> 16,
        f &= 65535,
        _ += o * s + i * a + r * c + n * l,
        _ &= 65535,
        e.low = u | d << 16,
        e.high = f | _ << 16,
        p && Ei(e)
}
const La = V.fromString("341873128712")
  , Na = V.fromString("132897987541");
function Ho(e, t, n, r, i) {
    const o = V.fromNumber(t);
    Vi(o, La);
    const s = V.fromNumber(n);
    Vi(s, Na),
    rn(o, s),
    rn(o, e.seed),
    rn(o, V.fromNumber(r));
    let a = i;
    return a == null && (a = e.edition === h.Bedrock ? "bedrock" : "java"),
    a === "bedrock" ? new ee(o) : new ge(o)
}

const Ki = {
    [Vn.id]: {
        tentPool: [["tent_bamboo_jungle_1", 1, [8, 8, 8]], ["tent_bamboo_jungle_2", 1, [8, 8, 8]], ["tent_bamboo_jungle_3", 1, [6, 8, 8]], ["tent_bamboo_jungle_4", 1, [8, 8, 8]], ["tent_bamboo_jungle_5", 1, [8, 8, 8]], ["tent_bamboo_jungle_6", 1, [8, 8, 8]], ["tent_bamboo_jungle_7", 1, [8, 8, 8]], ["tent_bamboo_jungle_8", 1, [6, 8, 8]], ["tent_bamboo_jungle_9", 1, [8, 8, 8]], ["tent_bamboo_jungle_10", 1, [8, 8, 8]]],
        biomeNbtKey: "bamboo_jungle"
    },
    [xn.id]: {
        tentPool: [["tent_birch_forest_1", 1, [8, 10, 8]], ["tent_birch_forest_2", 1, [8, 8, 8]], ["tent_birch_forest_3", 1, [6, 8, 8]], ["tent_birch_forest_4", 1, [8, 8, 8]], ["tent_birch_forest_5", 1, [8, 8, 8]], ["tent_birch_forest_6", 1, [8, 8, 8]], ["tent_birch_forest_7", 1, [8, 8, 8]], ["tent_birch_forest_8", 1, [6, 8, 8]], ["tent_birch_forest_9", 1, [8, 8, 8]], ["tent_birch_forest_10", 1, [8, 8, 8]]],
        biomeNbtKey: "birch_forest"
    },
    [Lr.id]: {
        tentPool: [["tent_cherry_grove_1", 1, [8, 11, 8]], ["tent_cherry_grove_2", 1, [8, 8, 8]], ["tent_cherry_grove_3", 1, [6, 8, 8]], ["tent_cherry_grove_4", 1, [8, 8, 8]], ["tent_cherry_grove_5", 1, [8, 8, 8]], ["tent_cherry_grove_6", 1, [8, 8, 8]], ["tent_cherry_grove_7", 1, [8, 8, 8]], ["tent_cherry_grove_8", 1, [6, 8, 8]], ["tent_cherry_grove_9", 1, [8, 8, 8]], ["tent_cherry_grove_10", 1, [8, 8, 8]]],
        biomeNbtKey: "cherry_grove"
    },
    [Ea.id]: {
        tentPool: [["tent_dappled_forest_1", 1, [8, 8, 8]], ["tent_dappled_forest_2", 1, [8, 9, 8]], ["tent_dappled_forest_3", 1, [6, 8, 8]], ["tent_dappled_forest_4", 1, [8, 9, 8]], ["tent_dappled_forest_5", 1, [8, 8, 8]], ["tent_dappled_forest_6", 1, [8, 8, 8]], ["tent_dappled_forest_7", 1, [8, 8, 8]], ["tent_dappled_forest_8", 1, [6, 8, 8]], ["tent_dappled_forest_9", 1, [8, 8, 8]], ["tent_dappled_forest_10", 1, [8, 8, 8]]],
        biomeNbtKey: "dappled_forest"
    },
    [Ar.id]: {
        tentPool: [["tent_flower_forest_1", 1, [8, 8, 8]], ["tent_flower_forest_2", 1, [8, 8, 8]], ["tent_flower_forest_3", 1, [6, 8, 8]], ["tent_flower_forest_4", 1, [8, 8, 8]], ["tent_flower_forest_5", 1, [8, 8, 8]], ["tent_flower_forest_6", 1, [8, 9, 8]], ["tent_flower_forest_7", 1, [8, 8, 8]], ["tent_flower_forest_8", 1, [6, 8, 8]], ["tent_flower_forest_9", 1, [8, 8, 8]], ["tent_flower_forest_10", 1, [8, 8, 8]]],
        biomeNbtKey: "flower_forest"
    },
    [At.id]: {
        tentPool: [["tent_forest_1", 1, [8, 8, 8]], ["tent_forest_2", 1, [8, 8, 8]], ["tent_forest_3", 1, [6, 8, 8]], ["tent_forest_4", 1, [8, 8, 8]], ["tent_forest_5", 1, [8, 8, 8]], ["tent_forest_6", 1, [8, 9, 8]], ["tent_forest_7", 1, [8, 8, 8]], ["tent_forest_8", 1, [6, 8, 8]], ["tent_forest_9", 1, [8, 8, 8]], ["tent_forest_10", 1, [8, 8, 8]]],
        biomeNbtKey: "forest"
    },
    [rt.id]: {
        tentPool: [["tent_meadow_1", 1, [8, 8, 8]], ["tent_meadow_2", 1, [8, 8, 8]], ["tent_meadow_3", 1, [6, 8, 8]], ["tent_meadow_4", 1, [8, 8, 8]], ["tent_meadow_5", 1, [8, 8, 8]], ["tent_meadow_6", 1, [8, 8, 8]], ["tent_meadow_7", 1, [8, 8, 8]], ["tent_meadow_8", 1, [6, 8, 8]], ["tent_meadow_9", 1, [8, 8, 8]], ["tent_meadow_10", 1, [8, 8, 8]]],
        biomeNbtKey: "meadow"
    },
    [Bn.id]: {
        tentPool: [["tent_old_growth_birch_forest_1", 1, [8, 8, 8]], ["tent_old_growth_birch_forest_2", 1, [8, 8, 8]], ["tent_old_growth_birch_forest_3", 1, [6, 8, 8]], ["tent_old_growth_birch_forest_4", 1, [8, 8, 8]], ["tent_old_growth_birch_forest_5", 1, [8, 8, 8]], ["tent_old_growth_birch_forest_6", 1, [8, 8, 8]], ["tent_old_growth_birch_forest_7", 1, [8, 8, 8]], ["tent_old_growth_birch_forest_8", 1, [6, 8, 8]], ["tent_old_growth_birch_forest_9", 1, [8, 8, 8]], ["tent_old_growth_birch_forest_10", 1, [8, 13, 8]]],
        biomeNbtKey: "old_growth_birch_forest"
    },
    [Pt.id]: {
        tentPool: [["tent_old_growth_pine_taiga_1", 1, [8, 10, 8]], ["tent_old_growth_pine_taiga_2", 1, [8, 8, 8]], ["tent_old_growth_pine_taiga_3", 1, [6, 8, 8]], ["tent_old_growth_pine_taiga_4", 1, [8, 8, 8]], ["tent_old_growth_pine_taiga_5", 1, [8, 8, 8]], ["tent_old_growth_pine_taiga_6", 1, [8, 8, 8]], ["tent_old_growth_pine_taiga_7", 1, [8, 8, 8]], ["tent_old_growth_pine_taiga_8", 1, [6, 8, 8]], ["tent_old_growth_pine_taiga_9", 1, [8, 8, 8]], ["tent_old_growth_pine_taiga_10", 1, [8, 8, 8]]],
        biomeNbtKey: "old_growth_pine_taiga"
    },
    [En.id]: {
        tentPool: [["tent_old_growth_spruce_taiga_1", 1, [8, 9, 8]], ["tent_old_growth_spruce_taiga_2", 1, [8, 8, 8]], ["tent_old_growth_spruce_taiga_3", 1, [6, 8, 8]], ["tent_old_growth_spruce_taiga_4", 1, [8, 8, 8]], ["tent_old_growth_spruce_taiga_5", 1, [8, 8, 8]], ["tent_old_growth_spruce_taiga_6", 1, [8, 8, 8]], ["tent_old_growth_spruce_taiga_7", 1, [8, 8, 8]], ["tent_old_growth_spruce_taiga_8", 1, [6, 8, 8]], ["tent_old_growth_spruce_taiga_9", 1, [8, 8, 8]], ["tent_old_growth_spruce_taiga_10", 1, [8, 8, 8]]],
        biomeNbtKey: "old_growth_spruce_taiga"
    },
    [Mn.id]: {
        tentPool: [["tent_pale_garden_1", 1, [8, 8, 8]], ["tent_pale_garden_2", 1, [8, 8, 8]], ["tent_pale_garden_3", 1, [6, 8, 8]], ["tent_pale_garden_4", 1, [8, 8, 8]], ["tent_pale_garden_5", 1, [8, 8, 8]], ["tent_pale_garden_6", 1, [8, 8, 8]], ["tent_pale_garden_7", 1, [8, 8, 8]], ["tent_pale_garden_8", 1, [6, 8, 8]], ["tent_pale_garden_9", 1, [8, 8, 8]], ["tent_pale_garden_10", 1, [8, 8, 8]]],
        biomeNbtKey: "pale_garden"
    },
    [Se.id]: {
        tentPool: [["tent_savanna_1", 1, [8, 9, 8]], ["tent_savanna_2", 1, [8, 8, 8]], ["tent_savanna_3", 1, [6, 8, 8]], ["tent_savanna_4", 1, [8, 8, 8]], ["tent_savanna_5", 1, [8, 8, 8]], ["tent_savanna_6", 1, [8, 8, 8]], ["tent_savanna_7", 1, [8, 8, 8]], ["tent_savanna_8", 1, [6, 8, 8]], ["tent_savanna_9", 1, [8, 8, 8]], ["tent_savanna_10", 1, [8, 8, 8]]],
        biomeNbtKey: "savanna"
    },
    [Ae.id]: {
        tentPool: [["tent_snowy_taiga_1", 1, [8, 8, 8]], ["tent_snowy_taiga_2", 1, [8, 8, 8]], ["tent_snowy_taiga_3", 1, [6, 8, 8]], ["tent_snowy_taiga_4", 1, [8, 8, 8]], ["tent_snowy_taiga_5", 1, [8, 8, 8]], ["tent_snowy_taiga_6", 1, [8, 8, 8]], ["tent_snowy_taiga_7", 1, [8, 8, 8]], ["tent_snowy_taiga_8", 1, [6, 8, 8]], ["tent_snowy_taiga_9", 1, [8, 10, 8]], ["tent_snowy_taiga_10", 1, [8, 12, 8]]],
        biomeNbtKey: "snowy_taiga"
    },
    [vn.id]: {
        tentPool: [["tent_sparse_jungle_1", 1, [8, 8, 8]], ["tent_sparse_jungle_2", 1, [8, 10, 8]], ["tent_sparse_jungle_3", 1, [6, 8, 8]], ["tent_sparse_jungle_4", 1, [8, 8, 8]], ["tent_sparse_jungle_5", 1, [8, 13, 8]], ["tent_sparse_jungle_6", 1, [8, 8, 8]], ["tent_sparse_jungle_7", 1, [8, 8, 8]], ["tent_sparse_jungle_8", 1, [6, 8, 8]], ["tent_sparse_jungle_9", 1, [8, 8, 8]], ["tent_sparse_jungle_10", 1, [8, 8, 8]]],
        biomeNbtKey: "sparse_jungle"
    },
    [Le.id]: {
        tentPool: [["tent_swamp_1", 1, [8, 8, 8]], ["tent_swamp_2", 1, [8, 8, 8]], ["tent_swamp_3", 1, [6, 8, 8]], ["tent_swamp_4", 1, [8, 10, 8]], ["tent_swamp_5", 1, [8, 8, 8]], ["tent_swamp_6", 1, [8, 8, 8]], ["tent_swamp_7", 1, [8, 8, 8]], ["tent_swamp_8", 1, [6, 8, 8]], ["tent_swamp_9", 1, [8, 8, 8]], ["tent_swamp_10", 1, [8, 8, 8]]],
        biomeNbtKey: "swamp"
    },
    [_e.id]: {
        tentPool: [["tent_taiga_1", 1, [8, 8, 8]], ["tent_taiga_2", 1, [8, 9, 8]], ["tent_taiga_3", 1, [6, 8, 8]], ["tent_taiga_4", 1, [8, 8, 8]], ["tent_taiga_5", 1, [8, 8, 8]], ["tent_taiga_6", 1, [8, 8, 8]], ["tent_taiga_7", 1, [8, 9, 8]], ["tent_taiga_8", 1, [6, 10, 8]], ["tent_taiga_9", 1, [8, 8, 8]], ["tent_taiga_10", 1, [8, 8, 8]]],
        biomeNbtKey: "taiga"
    },
    [wn.id]: {
        tentPool: [["tent_windswept_forest_1", 1, [8, 8, 8]], ["tent_windswept_forest_2", 1, [8, 8, 8]], ["tent_windswept_forest_3", 1, [6, 8, 8]], ["tent_windswept_forest_4", 1, [8, 8, 8]], ["tent_windswept_forest_5", 1, [8, 8, 8]], ["tent_windswept_forest_6", 1, [8, 11, 8]], ["tent_windswept_forest_7", 1, [8, 8, 8]], ["tent_windswept_forest_8", 1, [6, 8, 8]], ["tent_windswept_forest_9", 1, [8, 8, 8]], ["tent_windswept_forest_10", 1, [8, 8, 8]]],
        biomeNbtKey: "windswept_forest"
    },
    [Cn.id]: {
        tentPool: [["tent_wooded_badlands_1", 1, [8, 11, 8]], ["tent_wooded_badlands_2", 1, [8, 8, 8]], ["tent_wooded_badlands_3", 1, [6, 8, 8]], ["tent_wooded_badlands_4", 1, [8, 8, 8]], ["tent_wooded_badlands_5", 1, [8, 8, 8]], ["tent_wooded_badlands_6", 1, [8, 8, 8]], ["tent_wooded_badlands_7", 1, [8, 8, 8]], ["tent_wooded_badlands_8", 1, [6, 8, 8]], ["tent_wooded_badlands_9", 1, [8, 8, 8]], ["tent_wooded_badlands_10", 1, [8, 8, 8]]],
        biomeNbtKey: "wooded_badlands"
    }
}
  , Ru = new Set(["campsite_default_special_8", "campsite_sparse_jungle_2", "campsite_birch_forest_1"])
  , zu = "tent_cherry_grove_4"
  , Lu = e => [...e].sort( ([t], [n]) => t < n ? -1 : t > n ? 1 : 0)
  , Nu = e => e !== h.Bedrock ? Ki : Object.fromEntries(Object.entries(Ki).map( ([t,n]) => [t, {
    biomeNbtKey: n.biomeNbtKey,
    tentPool: Lu(n.tentPool)
}]))
  , Zn = e => e.sort( (t, n) => t < n ? -1 : t > n ? 1 : 0)
  , Hu = (e, t) => {
    const n = Array.from({
        length: 3
    }).map( (s, a) => `campsite_${t}_${a + 1}`)
      , r = Array.from({
        length: 15
    }).map( (s, a) => `campsite_default_barrel_${a + 1}`)
      , i = Array.from({
        length: 15
    }).map( (s, a) => `campsite_default_chest_${a + 1}`)
      , o = Array.from({
        length: 15
    }).map( (s, a) => `campsite_default_special_${a + 1}`);
    return e === h.Bedrock ? [...n, ...Zn(r), ...Zn(i), ...Zn(o)] : [...i, ...r, ...o, ...n]
}
  , Du = (e, t) => {
    for (let n = e.length; n > 1; --n) {
        const r = t.nextInt(n)
          , i = e[r];
        e[r] = e[n - 1],
        e[n - 1] = i
    }
}
  , Wu = {
    supportsWorld: e => N(g.AbandonedCamp, e),
    create: async (e, t) => {
        const n = t.overworld.noise()
          , r = Nu(e.edition)
          , i = Object.values(r)[0].tentPool;
        return J(e, {
            spacing: 34,
            separation: 8,
            salt: 91231127,
            forceRngType: "java",
            linearSeparation: e.edition !== h.Bedrock
        }, async (o, s) => it({
            world: e,
            biomeProvider: n,
            chunkX: o,
            chunkZ: s,
            initialY: 0,
            projectionY: {
                heightType: "worldSurface",
                surfaceCheckType: "topmostAccurate"
            },
            allowedBiomes: a => r[a.id] !== void 0,
            structures: i,
            mapResult: ({x: a, z: c, yBase: l}, {rng: u, biome: d, structureIndex: f}) => {
                const {tentPool: _, biomeNbtKey: p} = r[d.id]
                  , w = _[f][0]
                  , v = Hu(e.edition, p);
                Du(v, u);
                const T = v[0];
                return {
                    x: a,
                    y: l,
                    z: c,
                    tent: w,
                    camp: T,
                    hasSecretChest: Ru.has(T) || w === zu
                }
            }
        }), (o, s, a, c) => c, {
            x0: 0,
            z0: 0,
            x1: 1,
            z1: 1
        }, o => [o.x >> 4, o.z >> 4], !0)
    }
};