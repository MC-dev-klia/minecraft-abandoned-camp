!function() {
    try {
        var e = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : {}
          , n = (new e.Error).stack;
        n && (e._posthogChunkIds = e._posthogChunkIds || {},
        e._posthogChunkIds[n] = "019f3cc0-cba9-7162-92b4-2f1f8d4db8e1")
    } catch (e) {}
}();
const co = Symbol("Comlink.proxy")
  , Ms = Symbol("Comlink.endpoint")
  , As = Symbol("Comlink.releaseProxy")
  , Hn = Symbol("Comlink.finalizer")
  , Yt = Symbol("Comlink.thrown")
  , lo = e => typeof e == "object" && e !== null || typeof e == "function"
  , Fs = {
    canHandle: e => lo(e) && e[co],
    serialize(e) {
        const {port1: t, port2: n} = new MessageChannel;
        return Br(e, t),
        [n, [n]]
    },
    deserialize(e) {
        return e.start(),
        Ls(e)
    }
}
  , Ps = {
    canHandle: e => lo(e) && Yt in e,
    serialize({value: e}) {
        let t;
        return e instanceof Error ? t = {
            isError: !0,
            value: {
                message: e.message,
                name: e.name,
                stack: e.stack
            }
        } : t = {
            isError: !1,
            value: e
        },
        [t, []]
    },
    deserialize(e) {
        throw e.isError ? Object.assign(new Error(e.value.message), e.value) : e.value
    }
}
  , uo = new Map([["proxy", Fs], ["throw", Ps]]);
function Rs(e, t) {
    for (const n of e)
        if (t === n || n === "*" || n instanceof RegExp && n.test(t))
            return !0;
    return !1
}
function Br(e, t=globalThis, n=["*"]) {
    t.addEventListener("message", function r(i) {
        if (!i || !i.data)
            return;
        if (!Rs(n, i.origin)) {
            console.warn(`Invalid origin '${i.origin}' for comlink proxy`);
            return
        }
        const {id: o, type: s, path: a} = Object.assign({
            path: []
        }, i.data)
          , c = (i.data.argumentList || []).map(Ze);
        let l;
        try {
            const u = a.slice(0, -1).reduce( (f, _) => f[_], e)
              , d = a.reduce( (f, _) => f[_], e);
            switch (s) {
            case "GET":
                l = d;
                break;
            case "SET":
                u[a.slice(-1)[0]] = Ze(i.data.value),
                l = !0;
                break;
            case "APPLY":
                l = d.apply(u, c);
                break;
            case "CONSTRUCT":
                {
                    const f = new d(...c);
                    l = ho(f)
                }
                break;
            case "ENDPOINT":
                {
                    const {port1: f, port2: _} = new MessageChannel;
                    Br(e, _),
                    l = mo(f, [f])
                }
                break;
            case "RELEASE":
                l = void 0;
                break;
            default:
                return
            }
        } catch (u) {
            l = {
                value: u,
                [Yt]: 0
            }
        }
        Promise.resolve(l).catch(u => ({
            value: u,
            [Yt]: 0
        })).then(u => {
            const [d,f] = un(u);
            t.postMessage(Object.assign(Object.assign({}, d), {
                id: o
            }), f),
            s === "RELEASE" && (t.removeEventListener("message", r),
            fo(t),
            Hn in e && typeof e[Hn] == "function" && e[Hn]())
        }
        ).catch(u => {
            const [d,f] = un({
                value: new TypeError("Unserializable return value"),
                [Yt]: 0
            });
            t.postMessage(Object.assign(Object.assign({}, d), {
                id: o
            }), f)
        }
        )
    }),
    t.start && t.start()
}
function zs(e) {
    return e.constructor.name === "MessagePort"
}
function fo(e) {
    zs(e) && e.close()
}
function Ls(e, t) {
    const n = new Map;
    return e.addEventListener("message", function(i) {
        const {data: o} = i;
        if (!o || !o.id)
            return;
        const s = n.get(o.id);
        if (s)
            try {
                s(o)
            } finally {
                n.delete(o.id)
            }
    }),
    qn(e, n, [], t)
}
function jt(e) {
    if (e)
        throw new Error("Proxy has been released and is not useable")
}
function go(e) {
    return at(e, new Map, {
        type: "RELEASE"
    }).then( () => {
        fo(e)
    }
    )
}
const cn = new WeakMap
  , ln = "FinalizationRegistry"in globalThis && new FinalizationRegistry(e => {
    const t = (cn.get(e) || 0) - 1;
    cn.set(e, t),
    t === 0 && go(e)
}
);
function Ns(e, t) {
    const n = (cn.get(t) || 0) + 1;
    cn.set(t, n),
    ln && ln.register(e, t, e)
}
function Hs(e) {
    ln && ln.unregister(e)
}
function qn(e, t, n=[], r=function() {}
) {
    let i = !1;
    const o = new Proxy(r,{
        get(s, a) {
            if (jt(i),
            a === As)
                return () => {
                    Hs(o),
                    go(e),
                    t.clear(),
                    i = !0
                }
                ;
            if (a === "then") {
                if (n.length === 0)
                    return {
                        then: () => o
                    };
                const c = at(e, t, {
                    type: "GET",
                    path: n.map(l => l.toString())
                }).then(Ze);
                return c.then.bind(c)
            }
            return qn(e, t, [...n, a])
        },
        set(s, a, c) {
            jt(i);
            const [l,u] = un(c);
            return at(e, t, {
                type: "SET",
                path: [...n, a].map(d => d.toString()),
                value: l
            }, u).then(Ze)
        },
        apply(s, a, c) {
            jt(i);
            const l = n[n.length - 1];
            if (l === Ms)
                return at(e, t, {
                    type: "ENDPOINT"
                }).then(Ze);
            if (l === "bind")
                return qn(e, t, n.slice(0, -1));
            const [u,d] = ni(c);
            return at(e, t, {
                type: "APPLY",
                path: n.map(f => f.toString()),
                argumentList: u
            }, d).then(Ze)
        },
        construct(s, a) {
            jt(i);
            const [c,l] = ni(a);
            return at(e, t, {
                type: "CONSTRUCT",
                path: n.map(u => u.toString()),
                argumentList: c
            }, l).then(Ze)
        }
    });
    return Ns(o, e),
    o
}
function Ds(e) {
    return Array.prototype.concat.apply([], e)
}
function ni(e) {
    const t = e.map(un);
    return [t.map(n => n[0]), Ds(t.map(n => n[1]))]
}
const _o = new WeakMap;
function mo(e, t) {
    return _o.set(e, t),
    e
}
function ho(e) {
    return Object.assign(e, {
        [co]: !0
    })
}
function un(e) {
    for (const [t,n] of uo)
        if (n.canHandle(e)) {
            const [r,i] = n.serialize(e);
            return [{
                type: "HANDLER",
                name: t,
                value: r
            }, i]
        }
    return [{
        type: "RAW",
        value: e
    }, _o.get(e) || []]
}
function Ze(e) {
    switch (e.type) {
    case "HANDLER":
        return uo.get(e.name).deserialize(e.value);
    case "RAW":
        return e.value
    }
}
function at(e, t, n, r) {
    return new Promise(i => {
        const o = Ws();
        t.set(o, i),
        e.start && e.start(),
        e.postMessage(Object.assign({
            id: o
        }, n), r)
    }
    )
}
function Ws() {
    return new Array(4).fill(0).map( () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-")
}
var js = "/_astro/DlunatPXp67O.simd.wasm"
  , po = "/_astro/BhTqOT4MMVye.wasm";
class Qn {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        ii.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_bedrockfeatureseedgenerator_free(t, 0)
    }
    get_seed_for_chunk(t, n) {
        return b.bedrockfeatureseedgenerator_get_seed_for_chunk(this.__wbg_ptr, t, n)
    }
    constructor(t, n) {
        Z(t, ae);
        var r = t.__destroy_into_raw();
        const i = yo(n, b.__wbindgen_malloc, b.__wbindgen_realloc)
          , o = fn
          , s = b.bedrockfeatureseedgenerator_new(r, i, o);
        return this.__wbg_ptr = s,
        ii.register(this, this.__wbg_ptr, this),
        this
    }
}
Symbol.dispose && (Qn.prototype[Symbol.dispose] = Qn.prototype.free);
class Yn {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        oi.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_bedrockrandom_free(t, 0)
    }
    constructor(t, n) {
        const r = b.bedrockrandom_new(t, n);
        return this.__wbg_ptr = r,
        oi.register(this, this.__wbg_ptr, this),
        this
    }
    next_boolean() {
        return b.bedrockrandom_next_boolean(this.__wbg_ptr) !== 0
    }
    next_double() {
        return b.bedrockrandom_next_double(this.__wbg_ptr)
    }
    next_float() {
        return b.bedrockrandom_next_float(this.__wbg_ptr)
    }
    next_int(t) {
        return b.bedrockrandom_next_int(this.__wbg_ptr, t)
    }
    next_int_range(t, n) {
        return b.bedrockrandom_next_int_range(this.__wbg_ptr, t, n)
    }
    next_int_raw() {
        return b.bedrockrandom_next_int_raw(this.__wbg_ptr) >>> 0
    }
    next_int_unbound() {
        return b.bedrockrandom_next_int_unbound(this.__wbg_ptr)
    }
    set_seed(t, n) {
        b.bedrockrandom_set_seed(this.__wbg_ptr, t, n)
    }
}
Symbol.dispose && (Yn.prototype[Symbol.dispose] = Yn.prototype.free);
class er {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        si.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_biomeprovider_free(t, 0)
    }
    get_ints0(t, n, r, i) {
        const o = b.biomeprovider_get_ints0(this.__wbg_ptr, t, n, r, i);
        var s = Ie(o[0], o[1]).slice();
        return b.__wbindgen_free(o[0], o[1] * 4, 4),
        s
    }
    get_ints1(t, n, r, i) {
        const o = b.biomeprovider_get_ints1(this.__wbg_ptr, t, n, r, i);
        var s = Ie(o[0], o[1]).slice();
        return b.__wbindgen_free(o[0], o[1] * 4, 4),
        s
    }
    constructor(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.biomeprovider_new(n);
        return this.__wbg_ptr = r,
        si.register(this, this.__wbg_ptr, this),
        this
    }
}
Symbol.dispose && (er.prototype[Symbol.dispose] = er.prototype.free);
let tr = class {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        ai.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_biomeproviderend_free(t, 0)
    }
    get_biome_area(t, n, r, i, o) {
        const s = b.biomeproviderend_get_biome_area(this.__wbg_ptr, t, n, r, i, o);
        var a = en(s[0], s[1]).slice();
        return b.__wbindgen_free(s[0], s[1] * 1, 1),
        a
    }
    get_chunk_biome(t, n) {
        return b.biomeproviderend_get_chunk_biome(this.__wbg_ptr, t, n)
    }
    get_noise_biome(t, n) {
        return b.biomeproviderend_get_noise_biome(this.__wbg_ptr, t, n)
    }
    constructor(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.biomeproviderend_new(n);
        return this.__wbg_ptr = r,
        ai.register(this, this.__wbg_ptr, this),
        this
    }
}
;
Symbol.dispose && (tr.prototype[Symbol.dispose] = tr.prototype.free);
const St = Object.freeze({
    Unset: 0,
    0: "Unset",
    DefaultCaveStone: 254,
    254: "DefaultCaveStone",
    Stone: 1,
    1: "Stone",
    Water: 9,
    9: "Water",
    Lava: 11,
    11: "Lava",
    Chest: 54,
    54: "Chest",
    Air: 255,
    255: "Air"
});
let nr = class {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        ci.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_cavefinder_free(t, 0)
    }
    find(t, n, r, i, o) {
        return Z(t, se),
        b.cavefinder_find(this.__wbg_ptr, t.__wbg_ptr, n, r, i, o)
    }
    constructor(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.cavefinder_new(n);
        return this.__wbg_ptr = r,
        ci.register(this, this.__wbg_ptr, this),
        this
    }
}
;
Symbol.dispose && (nr.prototype[Symbol.dispose] = nr.prototype.free);
let rr = class {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        li.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_chunkgeneratorend_free(t, 0)
    }
    build_height_map(t, n) {
        const r = b.chunkgeneratorend_build_height_map(this.__wbg_ptr, t, n);
        var i = Ie(r[0], r[1]).slice();
        return b.__wbindgen_free(r[0], r[1] * 4, 4),
        i
    }
    constructor(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.chunkgeneratorend_new(n);
        return this.__wbg_ptr = r,
        li.register(this, this.__wbg_ptr, this),
        this
    }
}
;
Symbol.dispose && (rr.prototype[Symbol.dispose] = rr.prototype.free);
let ir = class {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        ui.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_dungeonfinder_free(t, 0)
    }
    find(t, n, r, i, o) {
        return Z(t, se),
        b.dungeonfinder_find(this.__wbg_ptr, t.__wbg_ptr, n, r, i, o)
    }
    find_legacy(t, n, r, i) {
        return b.dungeonfinder_find_legacy(this.__wbg_ptr, t, n, r, i)
    }
    constructor(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.dungeonfinder_new(n);
        return this.__wbg_ptr = r,
        ui.register(this, this.__wbg_ptr, this),
        this
    }
}
;
Symbol.dispose && (ir.prototype[Symbol.dispose] = ir.prototype.free);
const ri = Object.freeze({
    Java: 1,
    1: "Java",
    Bedrock: 2,
    2: "Bedrock"
})
  , bt = Object.freeze({
    WORLD_SURFACE: 1,
    1: "WORLD_SURFACE",
    OCEAN_FLOOR: 2,
    2: "OCEAN_FLOOR",
    CAVE_DEPTH: 3,
    3: "CAVE_DEPTH",
    BOTTOM: 4,
    4: "BOTTOM",
    DEPTH0: 5,
    5: "DEPTH0"
});
class or {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        fi.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_javarandom_free(t, 0)
    }
    get_seed() {
        const t = b.javarandom_get_seed(this.__wbg_ptr);
        var n = Ie(t[0], t[1]).slice();
        return b.__wbindgen_free(t[0], t[1] * 4, 4),
        n
    }
    constructor(t, n) {
        const r = b.javarandom_new(t, n);
        return this.__wbg_ptr = r,
        fi.register(this, this.__wbg_ptr, this),
        this
    }
    next(t) {
        return b.javarandom_next(this.__wbg_ptr, t)
    }
    next_boolean() {
        return b.javarandom_next_boolean(this.__wbg_ptr) !== 0
    }
    next_double() {
        return b.javarandom_next_double(this.__wbg_ptr)
    }
    next_float() {
        return b.javarandom_next_float(this.__wbg_ptr)
    }
    next_int(t) {
        return b.javarandom_next_int(this.__wbg_ptr, t)
    }
    next_int_unbound() {
        return b.javarandom_next_int_unbound(this.__wbg_ptr)
    }
    next_long() {
        const t = b.javarandom_next_long(this.__wbg_ptr);
        var n = Ie(t[0], t[1]).slice();
        return b.__wbindgen_free(t[0], t[1] * 4, 4),
        n
    }
    restore_seed(t, n) {
        b.javarandom_restore_seed(this.__wbg_ptr, t, n)
    }
    set_seed(t, n) {
        b.javarandom_set_seed(this.__wbg_ptr, t, n)
    }
    skip_next_n(t) {
        b.javarandom_skip_next_n(this.__wbg_ptr, t)
    }
}
Symbol.dispose && (or.prototype[Symbol.dispose] = or.prototype.free);
class sr {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        di.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_lavafloodedcavefinder_free(t, 0)
    }
    find(t, n, r, i, o) {
        return Z(t, se),
        b.lavafloodedcavefinder_find(this.__wbg_ptr, t.__wbg_ptr, n, r, i, o)
    }
    constructor(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.lavafloodedcavefinder_new(n);
        return this.__wbg_ptr = r,
        di.register(this, this.__wbg_ptr, this),
        this
    }
}
Symbol.dispose && (sr.prototype[Symbol.dispose] = sr.prototype.free);
class ar {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        gi.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_lavalakehelper_free(t, 0)
    }
    find_positions_bedrock(t, n, r, i, o) {
        return Z(t, se),
        b.lavalakehelper_find_positions_bedrock(this.__wbg_ptr, t.__wbg_ptr, n, r, i, o)
    }
    constructor(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.lavalakehelper_new(n);
        return this.__wbg_ptr = r,
        gi.register(this, this.__wbg_ptr, this),
        this
    }
    test_feature_positions_java(t, n) {
        return Z(t, se),
        b.lavalakehelper_test_feature_positions_java(this.__wbg_ptr, t.__wbg_ptr, n)
    }
}
Symbol.dispose && (ar.prototype[Symbol.dispose] = ar.prototype.free);
class se {
    static __wrap(t) {
        const n = Object.create(se.prototype);
        return n.__wbg_ptr = t,
        _i.register(n, n.__wbg_ptr, n),
        n
    }
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        _i.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_multinoisebiomesource_free(t, 0)
    }
    find_spawn_position() {
        const t = b.multinoisebiomesource_find_spawn_position(this.__wbg_ptr);
        var n = Ie(t[0], t[1]).slice();
        return b.__wbindgen_free(t[0], t[1] * 4, 4),
        n
    }
    get_noise_biome(t, n, r) {
        return b.multinoisebiomesource_get_noise_biome(this.__wbg_ptr, t, n, r)
    }
    get_noise_biome_area(t, n, r, i, o, s, a) {
        const c = b.multinoisebiomesource_get_noise_biome_area(this.__wbg_ptr, t, n, r, i, o, s, a);
        var l = en(c[0], c[1]).slice();
        return b.__wbindgen_free(c[0], c[1] * 1, 1),
        l
    }
    get_noise_biome_area_at_height_type(t, n, r, i, o, s) {
        const a = b.multinoisebiomesource_get_noise_biome_area_at_height_type(this.__wbg_ptr, t, n, r, i, o, s);
        var c = en(a[0], a[1]).slice();
        return b.__wbindgen_free(a[0], a[1] * 1, 1),
        c
    }
    get_noise_biome_area_at_height_type_with_surface(t, n, r, i, o, s, a, c) {
        const l = b.multinoisebiomesource_get_noise_biome_area_at_height_type_with_surface(this.__wbg_ptr, t, n, r, i, o, s, a, c);
        var u = Ie(l[0], l[1]).slice();
        return b.__wbindgen_free(l[0], l[1] * 4, 4),
        u
    }
    get_noise_biome_at_height_type(t, n, r) {
        return b.multinoisebiomesource_get_noise_biome_at_height_type(this.__wbg_ptr, t, n, r)
    }
    get_noise_biome_block(t, n, r) {
        return b.multinoisebiomesource_get_noise_biome_block(this.__wbg_ptr, t, n, r)
    }
    get_noise_biome_y_column(t, n, r) {
        const i = b.multinoisebiomesource_get_noise_biome_y_column(this.__wbg_ptr, t, n, r);
        var o = en(i[0], i[1]).slice();
        return b.__wbindgen_free(i[0], i[1] * 1, 1),
        o
    }
    get_noise_block(t, n, r, i) {
        return b.multinoisebiomesource_get_noise_block(this.__wbg_ptr, t, n, r, i)
    }
    get_preliminary_surface_level(t, n) {
        return b.multinoisebiomesource_get_preliminary_surface_level(this.__wbg_ptr, t, n)
    }
    get_surface(t, n, r, i) {
        return b.multinoisebiomesource_get_surface(this.__wbg_ptr, t, n, r, i)
    }
    get_surface_area(t, n, r, i, o, s, a) {
        const c = b.multinoisebiomesource_get_surface_area(this.__wbg_ptr, t, n, r, i, o, s, a);
        var l = Ie(c[0], c[1]).slice();
        return b.__wbindgen_free(c[0], c[1] * 4, 4),
        l
    }
    get_surface_block(t, n, r, i) {
        return b.multinoisebiomesource_get_surface_block(this.__wbg_ptr, t, n, r, i)
    }
    static new_nether(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.multinoisebiomesource_new_nether(n);
        return se.__wrap(r)
    }
    static new_overworld(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.multinoisebiomesource_new_overworld(n);
        return se.__wrap(r)
    }
}
Symbol.dispose && (se.prototype[Symbol.dispose] = se.prototype.free);
class cr {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        mi.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_netherfossilfinder_free(t, 0)
    }
    find(t, n, r, i, o) {
        return Z(o, se),
        b.netherfossilfinder_find(this.__wbg_ptr, t, n, r, i, o.__wbg_ptr)
    }
    constructor(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.netherfossilfinder_new(n);
        return this.__wbg_ptr = r,
        mi.register(this, this.__wbg_ptr, this),
        this
    }
}
Symbol.dispose && (cr.prototype[Symbol.dispose] = cr.prototype.free);
let lr = class {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        hi.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_oreveinfinder_free(t, 0)
    }
    find(t, n, r, i, o) {
        return Z(t, se),
        b.oreveinfinder_find(this.__wbg_ptr, t.__wbg_ptr, n, r, i, o)
    }
    constructor(t) {
        Z(t, ae);
        var n = t.__destroy_into_raw();
        const r = b.oreveinfinder_new(n);
        return this.__wbg_ptr = r,
        hi.register(this, this.__wbg_ptr, this),
        this
    }
}
;
Symbol.dispose && (lr.prototype[Symbol.dispose] = lr.prototype.free);
const Gt = Object.freeze({
    FAST_APPROXIMATE: 1,
    1: "FAST_APPROXIMATE",
    ENHANCED_NOCAVES: 2,
    2: "ENHANCED_NOCAVES",
    ENHANCED: 3,
    3: "ENHANCED",
    TOPMOST_ACCURATE: 4,
    4: "TOPMOST_ACCURATE"
});
class ae {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        pi.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_world_free(t, 0)
    }
    get biome_size() {
        const t = b.__wbg_get_world_biome_size(this.__wbg_ptr);
        return t === Number.MAX_SAFE_INTEGER ? void 0 : t
    }
    get edition() {
        return b.__wbg_get_world_edition(this.__wbg_ptr)
    }
    get large_biomes() {
        return b.__wbg_get_world_large_biomes(this.__wbg_ptr) !== 0
    }
    get version() {
        return b.__wbg_get_world_version(this.__wbg_ptr)
    }
    set biome_size(t) {
        b.__wbg_set_world_biome_size(this.__wbg_ptr, ur(t) ? Number.MAX_SAFE_INTEGER : t >> 0)
    }
    set edition(t) {
        b.__wbg_set_world_edition(this.__wbg_ptr, t)
    }
    set large_biomes(t) {
        b.__wbg_set_world_large_biomes(this.__wbg_ptr, t)
    }
    set version(t) {
        b.__wbg_set_world_version(this.__wbg_ptr, t)
    }
    constructor(t, n, r, i, o, s) {
        const a = b.world_new(t, n, r, i, ur(o) ? Number.MAX_SAFE_INTEGER : o >> 0, s);
        return this.__wbg_ptr = a,
        pi.register(this, this.__wbg_ptr, this),
        this
    }
}
Symbol.dispose && (ae.prototype[Symbol.dispose] = ae.prototype.free);
class Xe {
    static __wrap(t) {
        const n = Object.create(Xe.prototype);
        return n.__wbg_ptr = t,
        Dn.register(n, n.__wbg_ptr, n),
        n
    }
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0,
        Dn.unregister(this),
        t
    }
    free() {
        const t = this.__destroy_into_raw();
        b.__wbg_xoroshirorandomworldgen_free(t, 0)
    }
    constructor(t, n, r, i) {
        const o = b.xoroshirorandomworldgen_new(t, n, r, i);
        return this.__wbg_ptr = o,
        Dn.register(this, this.__wbg_ptr, this),
        this
    }
    static new_from_seed(t, n) {
        const r = b.xoroshirorandomworldgen_new_from_seed(t, n);
        return Xe.__wrap(r)
    }
    next_double() {
        return b.xoroshirorandomworldgen_next_double(this.__wbg_ptr)
    }
    next_float() {
        return b.xoroshirorandomworldgen_next_float(this.__wbg_ptr)
    }
    next_int(t) {
        return b.xoroshirorandomworldgen_next_int(this.__wbg_ptr, t)
    }
    next_long() {
        const t = b.xoroshirorandomworldgen_next_long(this.__wbg_ptr);
        var n = Ie(t[0], t[1]).slice();
        return b.__wbindgen_free(t[0], t[1] * 4, 4),
        n
    }
    set_seed(t, n) {
        b.xoroshirorandomworldgen_set_seed(this.__wbg_ptr, t, n)
    }
    skip_next_n(t) {
        b.xoroshirorandomworldgen_skip_next_n(this.__wbg_ptr, t)
    }
}
Symbol.dispose && (Xe.prototype[Symbol.dispose] = Xe.prototype.free);
function Gs() {
    return {
        __proto__: null,
        "./rust_wasm_bg.js": {
            __proto__: null,
            __wbg___wbindgen_throw_9c75d47bf9e7731e: function(t, n) {
                throw new Error(bi(t, n))
            },
            __wbg_parse_96694afe7f805200: function(t, n) {
                let r, i;
                try {
                    return r = t,
                    i = n,
                    JSON.parse(bi(t, n))
                } finally {
                    b.__wbindgen_free(r, i, 1)
                }
            },
            __wbg_stringify_f469d2b07ec0ff60: function(t, n) {
                const r = JSON.stringify(n);
                var i = ur(r) ? 0 : yo(r, b.__wbindgen_malloc, b.__wbindgen_realloc)
                  , o = fn;
                yi().setInt32(t + 4, o, !0),
                yi().setInt32(t + 0, i, !0)
            },
            __wbindgen_init_externref_table: function() {
                const t = b.__wbindgen_externrefs
                  , n = t.grow(4);
                t.set(0, void 0),
                t.set(n + 0, void 0),
                t.set(n + 1, null),
                t.set(n + 2, !0),
                t.set(n + 3, !1)
            }
        }
    }
}
const ii = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_bedrockfeatureseedgenerator_free(e, 1))
  , oi = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_bedrockrandom_free(e, 1))
  , si = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_biomeprovider_free(e, 1))
  , ai = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_biomeproviderend_free(e, 1))
  , ci = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_cavefinder_free(e, 1))
  , li = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_chunkgeneratorend_free(e, 1))
  , ui = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_dungeonfinder_free(e, 1))
  , fi = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_javarandom_free(e, 1))
  , di = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_lavafloodedcavefinder_free(e, 1))
  , gi = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_lavalakehelper_free(e, 1))
  , _i = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_multinoisebiomesource_free(e, 1))
  , mi = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_netherfossilfinder_free(e, 1))
  , hi = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_oreveinfinder_free(e, 1))
  , pi = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_world_free(e, 1));
typeof FinalizationRegistry > "u" || new FinalizationRegistry(e => b.__wbg_xoroshirorandom_free(e, 1));
const Dn = typeof FinalizationRegistry > "u" ? {
    register: () => {}
    ,
    unregister: () => {}
} : new FinalizationRegistry(e => b.__wbg_xoroshirorandomworldgen_free(e, 1));
function Z(e, t) {
    if (!(e instanceof t))
        throw new Error(`expected instance of ${t.name}`)
}
function Ie(e, t) {
    return e = e >>> 0,
    Js().subarray(e / 4, e / 4 + t)
}
function en(e, t) {
    return e = e >>> 0,
    Ct().subarray(e / 1, e / 1 + t)
}
let Je = null;
function yi() {
    return (Je === null || Je.buffer.detached === !0 || Je.buffer.detached === void 0 && Je.buffer !== b.memory.buffer) && (Je = new DataView(b.memory.buffer)),
    Je
}
let vt = null;
function Js() {
    return (vt === null || vt.byteLength === 0) && (vt = new Int32Array(b.memory.buffer)),
    vt
}
function bi(e, t) {
    return Zs(e >>> 0, t)
}
let xt = null;
function Ct() {
    return (xt === null || xt.byteLength === 0) && (xt = new Uint8Array(b.memory.buffer)),
    xt
}
function ur(e) {
    return e == null
}
function yo(e, t, n) {
    if (n === void 0) {
        const a = Tt.encode(e)
          , c = t(a.length, 1) >>> 0;
        return Ct().subarray(c, c + a.length).set(a),
        fn = a.length,
        c
    }
    let r = e.length
      , i = t(r, 1) >>> 0;
    const o = Ct();
    let s = 0;
    for (; s < r; s++) {
        const a = e.charCodeAt(s);
        if (a > 127)
            break;
        o[i + s] = a
    }
    if (s !== r) {
        s !== 0 && (e = e.slice(s)),
        i = n(i, r, r = s + e.length * 3, 1) >>> 0;
        const a = Ct().subarray(i + s, i + r)
          , c = Tt.encodeInto(e, a);
        s += c.written,
        i = n(i, r, s, 1) >>> 0
    }
    return fn = s,
    i
}
let tn = new TextDecoder("utf-8",{
    ignoreBOM: !0,
    fatal: !0
});
tn.decode();
const Us = 2146435072;
let Wn = 0;
function Zs(e, t) {
    return Wn += t,
    Wn >= Us && (tn = new TextDecoder("utf-8",{
        ignoreBOM: !0,
        fatal: !0
    }),
    tn.decode(),
    Wn = t),
    tn.decode(Ct().subarray(e, e + t))
}
const Tt = new TextEncoder;
"encodeInto"in Tt || (Tt.encodeInto = function(e, t) {
    const n = Tt.encode(e);
    return t.set(n),
    {
        read: e.length,
        written: n.length
    }
}
);
let fn = 0, b;
function Ks(e, t) {
    return b = e.exports,
    Je = null,
    vt = null,
    xt = null,
    b.__wbindgen_start(),
    b
}
async function Xs(e, t) {
    if (typeof Response == "function" && e instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming == "function")
            try {
                return await WebAssembly.instantiateStreaming(e, t)
            } catch (i) {
                if (e.ok && n(e.type) && e.headers.get("Content-Type") !== "application/wasm")
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", i);
                else
                    throw i
            }
        const r = await e.arrayBuffer();
        return await WebAssembly.instantiate(r, t)
    } else {
        const r = await WebAssembly.instantiate(e, t);
        return r instanceof WebAssembly.Instance ? {
            instance: r,
            module: e
        } : r
    }
    function n(r) {
        switch (r) {
        case "basic":
        case "cors":
        case "default":
            return !0
        }
        return !1
    }
}
async function $s(e) {
    if (b !== void 0)
        return b;
    e !== void 0 && (Object.getPrototypeOf(e) === Object.prototype ? {module_or_path: e} = e : console.warn("using deprecated parameters for the initialization function; pass a single object instead")),
    e === void 0 && (e = po);
    const t = Gs();
    (typeof e == "string" || typeof Request == "function" && e instanceof Request || typeof URL == "function" && e instanceof URL) && (e = fetch(e));
    const {instance: n, module: r} = await Xs(await e, t);
    return Ks(n)
}
const qs = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
let jn;
async function Qs() {
    if (!jn) {
        const t = await qs().catch(n => (console.error("wasm-feature-detect failed, defaulting to SIMD build", n),
        !0)) ? js : po;
        jn = await $s({
            module_or_path: t
        })
    }
    return jn
}
const Ys = 64
  , lt = new Set;
function ea(e) {
    if (lt.add(e),
    lt.size > Ys)
        for (const t of lt) {
            lt.delete(t);
            break
        }
}
class fr extends Error {
    constructor() {
        super("task cancelled")
    }
}
const we = async () => {}
  , ta = 200;
function na(e) {
    if (e === void 0)
        return we;
    let t = performance.now();
    return async () => {
        if (lt.has(e))
            throw new fr;
        if (!(performance.now() - t < ta) && (await ra(),
        t = performance.now(),
        lt.has(e)))
            throw new fr
    }
}
function ra() {
    return new Promise(e => {
        const {port1: t, port2: n} = new MessageChannel;
        t.onmessage = () => {
            t.close(),
            e()
        }
        ,
        n.postMessage(null)
    }
    )
}
class ia extends Map {
    #n = 0;
    #e = new Map;
    #t = new Map;
    #i;
    #s;
    #o;
    constructor(t={}) {
        if (super(),
        !(t.maxSize && t.maxSize > 0))
            throw new TypeError("`maxSize` must be a number greater than 0");
        if (typeof t.maxAge == "number" && t.maxAge === 0)
            throw new TypeError("`maxAge` must be a number greater than 0");
        this.#i = t.maxSize,
        this.#s = t.maxAge || Number.POSITIVE_INFINITY,
        this.#o = t.onEviction
    }
    get __oldCache() {
        return this.#t
    }
    #a(t) {
        if (typeof this.#o == "function")
            for (const [n,r] of t)
                this.#o(n, r.value)
    }
    #r(t, n) {
        return typeof n.expiry == "number" && n.expiry <= Date.now() ? (typeof this.#o == "function" && this.#o(t, n.value),
        this.delete(t)) : !1
    }
    #d(t, n) {
        if (this.#r(t, n) === !1)
            return n.value
    }
    #l(t, n) {
        return n.expiry ? this.#d(t, n) : n.value
    }
    #u(t, n) {
        const r = n.get(t);
        return this.#l(t, r)
    }
    #f(t, n) {
        this.#e.set(t, n),
        this.#n++,
        this.#n >= this.#i && (this.#n = 0,
        this.#a(this.#t),
        this.#t = this.#e,
        this.#e = new Map)
    }
    #g(t, n) {
        this.#t.delete(t),
        this.#f(t, n)
    }
    *#c() {
        for (const t of this.#t) {
            const [n,r] = t;
            this.#e.has(n) || this.#r(n, r) === !1 && (yield t)
        }
        for (const t of this.#e) {
            const [n,r] = t;
            this.#r(n, r) === !1 && (yield t)
        }
    }
    get(t) {
        if (this.#e.has(t)) {
            const n = this.#e.get(t);
            return this.#l(t, n)
        }
        if (this.#t.has(t)) {
            const n = this.#t.get(t);
            if (this.#r(t, n) === !1)
                return this.#g(t, n),
                n.value
        }
    }
    set(t, n, {maxAge: r=this.#s}={}) {
        const i = typeof r == "number" && r !== Number.POSITIVE_INFINITY ? Date.now() + r : void 0;
        return this.#e.has(t) ? this.#e.set(t, {
            value: n,
            expiry: i
        }) : this.#f(t, {
            value: n,
            expiry: i
        }),
        this
    }
    has(t) {
        return this.#e.has(t) ? !this.#r(t, this.#e.get(t)) : this.#t.has(t) ? !this.#r(t, this.#t.get(t)) : !1
    }
    peek(t) {
        if (this.#e.has(t))
            return this.#u(t, this.#e);
        if (this.#t.has(t))
            return this.#u(t, this.#t)
    }
    expiresIn(t) {
        const n = this.#e.get(t) ?? this.#t.get(t);
        if (n)
            return n.expiry ? n.expiry - Date.now() : Number.POSITIVE_INFINITY
    }
    delete(t) {
        const n = this.#e.delete(t);
        return n && this.#n--,
        this.#t.delete(t) || n
    }
    clear() {
        this.#e.clear(),
        this.#t.clear(),
        this.#n = 0
    }
    resize(t) {
        if (!(t && t > 0))
            throw new TypeError("`maxSize` must be a number greater than 0");
        const n = [...this.#c()]
          , r = n.length - t;
        r < 0 ? (this.#e = new Map(n),
        this.#t = new Map,
        this.#n = n.length) : (r > 0 && this.#a(n.slice(0, r)),
        this.#t = new Map(n.slice(r)),
        this.#e = new Map,
        this.#n = 0),
        this.#i = t
    }
    evict(t=1) {
        const n = Number(t);
        if (!n || n <= 0)
            return;
        const r = [...this.#c()]
          , i = Math.trunc(Math.min(n, Math.max(r.length - 1, 0)));
        i <= 0 || (this.#a(r.slice(0, i)),
        this.#t = new Map(r.slice(i)),
        this.#e = new Map,
        this.#n = 0)
    }
    *keys() {
        for (const [t] of this)
            yield t
    }
    *values() {
        for (const [,t] of this)
            yield t
    }
    *[Symbol.iterator]() {
        for (const t of this.#e) {
            const [n,r] = t;
            this.#r(n, r) === !1 && (yield[n, r.value])
        }
        for (const t of this.#t) {
            const [n,r] = t;
            this.#e.has(n) || this.#r(n, r) === !1 && (yield[n, r.value])
        }
    }
    *entriesDescending() {
        let t = [...this.#e];
        for (let n = t.length - 1; n >= 0; --n) {
            const r = t[n]
              , [i,o] = r;
            this.#r(i, o) === !1 && (yield[i, o.value])
        }
        t = [...this.#t];
        for (let n = t.length - 1; n >= 0; --n) {
            const r = t[n]
              , [i,o] = r;
            this.#e.has(i) || this.#r(i, o) === !1 && (yield[i, o.value])
        }
    }
    *entriesAscending() {
        for (const [t,n] of this.#c())
            yield[t, n.value]
    }
    get size() {
        if (!this.#n)
            return this.#t.size;
        let t = 0;
        for (const n of this.#t.keys())
            this.#e.has(n) || t++;
        return Math.min(this.#n + t, this.#i)
    }
    get maxSize() {
        return this.#i
    }
    get maxAge() {
        return this.#s
    }
    entries() {
        return this.entriesAscending()
    }
    forEach(t, n=this) {
        for (const [r,i] of this.entriesAscending())
            t.call(n, i, r, this)
    }
    get[Symbol.toStringTag]() {
        return "QuickLRU"
    }
    toString() {
        return `QuickLRU(${this.size}/${this.maxSize})`
    }
    [Symbol.for("nodejs.util.inspect.custom")]() {
        return this.toString()
    }
}
const Er = new ia({
    maxSize: 1024
});
function oa(e) {
    return Er.get(e)
}
function sa(e, t) {
    Er.set(e, t)
}
function aa() {
    Er.clear()
}
var pe = null;
try {
    pe = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11])),{}).exports
} catch {}
function V(e, t, n) {
    this.low = e | 0,
    this.high = t | 0,
    this.unsigned = !!n
}
V.prototype.__isLong__;
Object.defineProperty(V.prototype, "__isLong__", {
    value: !0
});
function re(e) {
    return (e && e.__isLong__) === !0
}
function wi(e) {
    var t = Math.clz32(e & -e);
    return e ? 31 - t : t
}
V.isLong = re;
var vi = {}
  , xi = {};
function tt(e, t) {
    var n, r, i;
    return t ? (e >>>= 0,
    (i = 0 <= e && e < 256) && (r = xi[e],
    r) ? r : (n = D(e, 0, !0),
    i && (xi[e] = n),
    n)) : (e |= 0,
    (i = -128 <= e && e < 128) && (r = vi[e],
    r) ? r : (n = D(e, e < 0 ? -1 : 0, !1),
    i && (vi[e] = n),
    n))
}
V.fromInt = tt;
function ye(e, t) {
    if (isNaN(e))
        return t ? ke : Te;
    if (t) {
        if (e < 0)
            return ke;
        if (e >= bo)
            return xo
    } else {
        if (e <= -Ci)
            return ce;
        if (e + 1 >= Ci)
            return vo
    }
    return e < 0 ? ye(-e, t).neg() : D(e % gt | 0, e / gt | 0, t)
}
V.fromNumber = ye;
function D(e, t, n) {
    return new V(e,t,n)
}
V.fromBits = D;
var dn = Math.pow;
function Vr(e, t, n) {
    if (e.length === 0)
        throw Error("empty string");
    if (typeof t == "number" ? (n = t,
    t = !1) : t = !!t,
    e === "NaN" || e === "Infinity" || e === "+Infinity" || e === "-Infinity")
        return t ? ke : Te;
    if (n = n || 10,
    n < 2 || 36 < n)
        throw RangeError("radix");
    var r;
    if ((r = e.indexOf("-")) > 0)
        throw Error("interior hyphen");
    if (r === 0)
        return Vr(e.substring(1), t, n).neg();
    for (var i = ye(dn(n, 8)), o = Te, s = 0; s < e.length; s += 8) {
        var a = Math.min(8, e.length - s)
          , c = parseInt(e.substring(s, s + a), n);
        if (a < 8) {
            var l = ye(dn(n, a));
            o = o.mul(l).add(ye(c))
        } else
            o = o.mul(i),
            o = o.add(ye(c))
    }
    return o.unsigned = t,
    o
}
V.fromString = Vr;
function ve(e, t) {
    return typeof e == "number" ? ye(e, t) : typeof e == "string" ? Vr(e, t) : D(e.low, e.high, typeof t == "boolean" ? t : e.unsigned)
}
V.fromValue = ve;
var Si = 65536
  , ca = 1 << 24
  , gt = Si * Si
  , bo = gt * gt
  , Ci = bo / 2
  , Ti = tt(ca)
  , Te = tt(0);
V.ZERO = Te;
var ke = tt(0, !0);
V.UZERO = ke;
var ut = tt(1);
V.ONE = ut;
var wo = tt(1, !0);
V.UONE = wo;
var dr = tt(-1);
V.NEG_ONE = dr;
var vo = D(-1, 2147483647, !1);
V.MAX_VALUE = vo;
var xo = D(-1, -1, !0);
V.MAX_UNSIGNED_VALUE = xo;
var ce = D(0, -2147483648, !1);
V.MIN_VALUE = ce;
var S = V.prototype;
S.toInt = function() {
    return this.unsigned ? this.low >>> 0 : this.low
}
;
S.toNumber = function() {
    return this.unsigned ? (this.high >>> 0) * gt + (this.low >>> 0) : this.high * gt + (this.low >>> 0)
}
;
S.toString = function(t) {
    if (t = t || 10,
    t < 2 || 36 < t)
        throw RangeError("radix");
    if (this.isZero())
        return "0";
    if (this.isNegative())
        if (this.eq(ce)) {
            var n = ye(t)
              , r = this.div(n)
              , i = r.mul(n).sub(this);
            return r.toString(t) + i.toInt().toString(t)
        } else
            return "-" + this.neg().toString(t);
    for (var o = ye(dn(t, 6), this.unsigned), s = this, a = ""; ; ) {
        var c = s.div(o)
          , l = s.sub(c.mul(o)).toInt() >>> 0
          , u = l.toString(t);
        if (s = c,
        s.isZero())
            return u + a;
        for (; u.length < 6; )
            u = "0" + u;
        a = "" + u + a
    }
}
;
S.getHighBits = function() {
    return this.high
}
;
S.getHighBitsUnsigned = function() {
    return this.high >>> 0
}
;
S.getLowBits = function() {
    return this.low
}
;
S.getLowBitsUnsigned = function() {
    return this.low >>> 0
}
;
S.getNumBitsAbs = function() {
    if (this.isNegative())
        return this.eq(ce) ? 64 : this.neg().getNumBitsAbs();
    for (var t = this.high != 0 ? this.high : this.low, n = 31; n > 0 && (t & 1 << n) == 0; n--)
        ;
    return this.high != 0 ? n + 33 : n + 1
}
;
S.isSafeInteger = function() {
    var t = this.high >> 21;
    return t ? this.unsigned ? !1 : t === -1 && !(this.low === 0 && this.high === -2097152) : !0
}
;
S.isZero = function() {
    return this.high === 0 && this.low === 0
}
;
S.eqz = S.isZero;
S.isNegative = function() {
    return !this.unsigned && this.high < 0
}
;
S.isPositive = function() {
    return this.unsigned || this.high >= 0
}
;
S.isOdd = function() {
    return (this.low & 1) === 1
}
;
S.isEven = function() {
    return (this.low & 1) === 0
}
;
S.equals = function(t) {
    return re(t) || (t = ve(t)),
    this.unsigned !== t.unsigned && this.high >>> 31 === 1 && t.high >>> 31 === 1 ? !1 : this.high === t.high && this.low === t.low
}
;
S.eq = S.equals;
S.notEquals = function(t) {
    return !this.eq(t)
}
;
S.neq = S.notEquals;
S.ne = S.notEquals;
S.lessThan = function(t) {
    return this.comp(t) < 0
}
;
S.lt = S.lessThan;
S.lessThanOrEqual = function(t) {
    return this.comp(t) <= 0
}
;
S.lte = S.lessThanOrEqual;
S.le = S.lessThanOrEqual;
S.greaterThan = function(t) {
    return this.comp(t) > 0
}
;
S.gt = S.greaterThan;
S.greaterThanOrEqual = function(t) {
    return this.comp(t) >= 0
}
;
S.gte = S.greaterThanOrEqual;
S.ge = S.greaterThanOrEqual;
S.compare = function(t) {
    if (re(t) || (t = ve(t)),
    this.eq(t))
        return 0;
    var n = this.isNegative()
      , r = t.isNegative();
    return n && !r ? -1 : !n && r ? 1 : this.unsigned ? t.high >>> 0 > this.high >>> 0 || t.high === this.high && t.low >>> 0 > this.low >>> 0 ? -1 : 1 : this.sub(t).isNegative() ? -1 : 1
}
;
S.comp = S.compare;
S.negate = function() {
    return !this.unsigned && this.eq(ce) ? ce : this.not().add(ut)
}
;
S.neg = S.negate;
S.add = function(t) {
    re(t) || (t = ve(t));
    var n = this.high >>> 16
      , r = this.high & 65535
      , i = this.low >>> 16
      , o = this.low & 65535
      , s = t.high >>> 16
      , a = t.high & 65535
      , c = t.low >>> 16
      , l = t.low & 65535
      , u = 0
      , d = 0
      , f = 0
      , _ = 0;
    return _ += o + l,
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
    D(f << 16 | _, u << 16 | d, this.unsigned)
}
;
S.subtract = function(t) {
    return re(t) || (t = ve(t)),
    this.add(t.neg())
}
;
S.sub = S.subtract;
S.multiply = function(t) {
    if (this.isZero())
        return this;
    if (re(t) || (t = ve(t)),
    pe) {
        var n = pe.mul(this.low, this.high, t.low, t.high);
        return D(n, pe.get_high(), this.unsigned)
    }
    if (t.isZero())
        return this.unsigned ? ke : Te;
    if (this.eq(ce))
        return t.isOdd() ? ce : Te;
    if (t.eq(ce))
        return this.isOdd() ? ce : Te;
    if (this.isNegative())
        return t.isNegative() ? this.neg().mul(t.neg()) : this.neg().mul(t).neg();
    if (t.isNegative())
        return this.mul(t.neg()).neg();
    if (this.lt(Ti) && t.lt(Ti))
        return ye(this.toNumber() * t.toNumber(), this.unsigned);
    var r = this.high >>> 16
      , i = this.high & 65535
      , o = this.low >>> 16
      , s = this.low & 65535
      , a = t.high >>> 16
      , c = t.high & 65535
      , l = t.low >>> 16
      , u = t.low & 65535
      , d = 0
      , f = 0
      , _ = 0
      , p = 0;
    return p += s * u,
    _ += p >>> 16,
    p &= 65535,
    _ += o * u,
    f += _ >>> 16,
    _ &= 65535,
    _ += s * l,
    f += _ >>> 16,
    _ &= 65535,
    f += i * u,
    d += f >>> 16,
    f &= 65535,
    f += o * l,
    d += f >>> 16,
    f &= 65535,
    f += s * c,
    d += f >>> 16,
    f &= 65535,
    d += r * u + i * l + o * c + s * a,
    d &= 65535,
    D(_ << 16 | p, d << 16 | f, this.unsigned)
}
;
S.mul = S.multiply;
S.divide = function(t) {
    if (re(t) || (t = ve(t)),
    t.isZero())
        throw Error("division by zero");
    if (pe) {
        if (!this.unsigned && this.high === -2147483648 && t.low === -1 && t.high === -1)
            return this;
        var n = (this.unsigned ? pe.div_u : pe.div_s)(this.low, this.high, t.low, t.high);
        return D(n, pe.get_high(), this.unsigned)
    }
    if (this.isZero())
        return this.unsigned ? ke : Te;
    var r, i, o;
    if (this.unsigned) {
        if (t.unsigned || (t = t.toUnsigned()),
        t.gt(this))
            return ke;
        if (t.gt(this.shru(1)))
            return wo;
        o = ke
    } else {
        if (this.eq(ce)) {
            if (t.eq(ut) || t.eq(dr))
                return ce;
            if (t.eq(ce))
                return ut;
            var s = this.shr(1);
            return r = s.div(t).shl(1),
            r.eq(Te) ? t.isNegative() ? ut : dr : (i = this.sub(t.mul(r)),
            o = r.add(i.div(t)),
            o)
        } else if (t.eq(ce))
            return this.unsigned ? ke : Te;
        if (this.isNegative())
            return t.isNegative() ? this.neg().div(t.neg()) : this.neg().div(t).neg();
        if (t.isNegative())
            return this.div(t.neg()).neg();
        o = Te
    }
    for (i = this; i.gte(t); ) {
        r = Math.max(1, Math.floor(i.toNumber() / t.toNumber()));
        for (var a = Math.ceil(Math.log(r) / Math.LN2), c = a <= 48 ? 1 : dn(2, a - 48), l = ye(r), u = l.mul(t); u.isNegative() || u.gt(i); )
            r -= c,
            l = ye(r, this.unsigned),
            u = l.mul(t);
        l.isZero() && (l = ut),
        o = o.add(l),
        i = i.sub(u)
    }
    return o
}
;
S.div = S.divide;
S.modulo = function(t) {
    if (re(t) || (t = ve(t)),
    pe) {
        var n = (this.unsigned ? pe.rem_u : pe.rem_s)(this.low, this.high, t.low, t.high);
        return D(n, pe.get_high(), this.unsigned)
    }
    return this.sub(this.div(t).mul(t))
}
;
S.mod = S.modulo;
S.rem = S.modulo;
S.not = function() {
    return D(~this.low, ~this.high, this.unsigned)
}
;
S.countLeadingZeros = function() {
    return this.high ? Math.clz32(this.high) : Math.clz32(this.low) + 32
}
;
S.clz = S.countLeadingZeros;
S.countTrailingZeros = function() {
    return this.low ? wi(this.low) : wi(this.high) + 32
}
;
S.ctz = S.countTrailingZeros;
S.and = function(t) {
    return re(t) || (t = ve(t)),
    D(this.low & t.low, this.high & t.high, this.unsigned)
}
;
S.or = function(t) {
    return re(t) || (t = ve(t)),
    D(this.low | t.low, this.high | t.high, this.unsigned)
}
;
S.xor = function(t) {
    return re(t) || (t = ve(t)),
    D(this.low ^ t.low, this.high ^ t.high, this.unsigned)
}
;
S.shiftLeft = function(t) {
    return re(t) && (t = t.toInt()),
    (t &= 63) === 0 ? this : t < 32 ? D(this.low << t, this.high << t | this.low >>> 32 - t, this.unsigned) : D(0, this.low << t - 32, this.unsigned)
}
;
S.shl = S.shiftLeft;
S.shiftRight = function(t) {
    return re(t) && (t = t.toInt()),
    (t &= 63) === 0 ? this : t < 32 ? D(this.low >>> t | this.high << 32 - t, this.high >> t, this.unsigned) : D(this.high >> t - 32, this.high >= 0 ? 0 : -1, this.unsigned)
}
;
S.shr = S.shiftRight;
S.shiftRightUnsigned = function(t) {
    return re(t) && (t = t.toInt()),
    (t &= 63) === 0 ? this : t < 32 ? D(this.low >>> t | this.high << 32 - t, this.high >>> t, this.unsigned) : t === 32 ? D(this.high, 0, this.unsigned) : D(this.high >>> t - 32, 0, this.unsigned)
}
;
S.shru = S.shiftRightUnsigned;
S.shr_u = S.shiftRightUnsigned;
S.rotateLeft = function(t) {
    var n;
    return re(t) && (t = t.toInt()),
    (t &= 63) === 0 ? this : t === 32 ? D(this.high, this.low, this.unsigned) : t < 32 ? (n = 32 - t,
    D(this.low << t | this.high >>> n, this.high << t | this.low >>> n, this.unsigned)) : (t -= 32,
    n = 32 - t,
    D(this.high << t | this.low >>> n, this.low << t | this.high >>> n, this.unsigned))
}
;
S.rotl = S.rotateLeft;
S.rotateRight = function(t) {
    var n;
    return re(t) && (t = t.toInt()),
    (t &= 63) === 0 ? this : t === 32 ? D(this.high, this.low, this.unsigned) : t < 32 ? (n = 32 - t,
    D(this.high << n | this.low >>> t, this.low << n | this.high >>> t, this.unsigned)) : (t -= 32,
    n = 32 - t,
    D(this.low << n | this.high >>> t, this.high << n | this.low >>> t, this.unsigned))
}
;
S.rotr = S.rotateRight;
S.toSigned = function() {
    return this.unsigned ? D(this.low, this.high, !1) : this
}
;
S.toUnsigned = function() {
    return this.unsigned ? this : D(this.low, this.high, !0)
}
;
S.toBytes = function(t) {
    return t ? this.toBytesLE() : this.toBytesBE()
}
;
S.toBytesLE = function() {
    var t = this.high
      , n = this.low;
    return [n & 255, n >>> 8 & 255, n >>> 16 & 255, n >>> 24, t & 255, t >>> 8 & 255, t >>> 16 & 255, t >>> 24]
}
;
S.toBytesBE = function() {
    var t = this.high
      , n = this.low;
    return [t >>> 24, t >>> 16 & 255, t >>> 8 & 255, t & 255, n >>> 24, n >>> 16 & 255, n >>> 8 & 255, n & 255]
}
;
V.fromBytes = function(t, n, r) {
    return r ? V.fromBytesLE(t, n) : V.fromBytesBE(t, n)
}
;
V.fromBytesLE = function(t, n) {
    return new V(t[0] | t[1] << 8 | t[2] << 16 | t[3] << 24,t[4] | t[5] << 8 | t[6] << 16 | t[7] << 24,n)
}
;
V.fromBytesBE = function(t, n) {
    return new V(t[4] << 24 | t[5] << 16 | t[6] << 8 | t[7],t[0] << 24 | t[1] << 16 | t[2] << 8 | t[3],n)
}
;
typeof BigInt == "function" && (V.fromBigInt = function(t, n) {
    var r = Number(BigInt.asIntN(32, t))
      , i = Number(BigInt.asIntN(32, t >> BigInt(32)));
    return D(r, i, n)
}
,
V.fromValue = function(t, n) {
    return typeof t == "bigint" ? V.fromBigInt(t, n) : ve(t, n)
}
,
S.toBigInt = function() {
    var t = BigInt(this.low >>> 0)
      , n = BigInt(this.unsigned ? this.high >>> 0 : this.high);
    return n << BigInt(32) | t
}
);
var h = (e => (e.Java = "Java",
e.Bedrock = "Bedrock",
e))(h || {})
  , m = (e => (e[e.V1_7 = 100700] = "V1_7",
e[e.V1_8 = 100800] = "V1_8",
e[e.V1_9 = 100900] = "V1_9",
e[e.V1_10 = 101e3] = "V1_10",
e[e.V1_11 = 101100] = "V1_11",
e[e.V1_12 = 101200] = "V1_12",
e[e.V1_13 = 101300] = "V1_13",
e[e.V1_14 = 101400] = "V1_14",
e[e.V1_15 = 101500] = "V1_15",
e[e.V1_16 = 101600] = "V1_16",
e[e.V1_17 = 101700] = "V1_17",
e[e.V1_18 = 101800] = "V1_18",
e[e.V1_19 = 101900] = "V1_19",
e[e.V1_19_3 = 101903] = "V1_19_3",
e[e.V1_20 = 102e3] = "V1_20",
e[e.V1_21 = 102100] = "V1_21",
e[e.V1_21_2 = 102102] = "V1_21_2",
e[e.V1_21_4 = 102104] = "V1_21_4",
e[e.V1_21_5 = 102105] = "V1_21_5",
e[e.V1_21_6 = 102106] = "V1_21_6",
e[e.V1_21_9 = 102109] = "V1_21_9",
e[e.V26_2 = 260200] = "V26_2",
e[e.V26_3 = 260300] = "V26_3",
e))(m || {})
  , x = (e => (e[e.V1_14 = 101400] = "V1_14",
e[e.V1_16 = 101600] = "V1_16",
e[e.V1_17 = 101700] = "V1_17",
e[e.V1_18 = 101800] = "V1_18",
e[e.V1_19 = 101900] = "V1_19",
e[e.V1_20 = 102e3] = "V1_20",
e[e.V1_20_60 = 102006] = "V1_20_60",
e[e.V1_21 = 102100] = "V1_21",
e[e.V1_21_40 = 102104] = "V1_21_40",
e[e.V1_21_50 = 102105] = "V1_21_50",
e[e.V1_21_60 = 102106] = "V1_21_60",
e[e.V1_21_70 = 102107] = "V1_21_70",
e[e.V1_21_80 = 102108] = "V1_21_80",
e[e.V1_21_90 = 102109] = "V1_21_90",
e[e.V1_21_110 = 102111] = "V1_21_110",
e[e.V1_21_120 = 102112] = "V1_21_120",
e[e.V26_30 = 263e3] = "V26_30",
e[e.V26_40 = 264e3] = "V26_40",
e))(x || {})
  , y = (e => (e.Overworld = "overworld",
e.Nether = "nether",
e.End = "end",
e))(y || {})
  , de = (e => (e[e.ZOMBIE = 0] = "ZOMBIE",
e[e.SPIDER = 1] = "SPIDER",
e[e.SKELETON = 2] = "SKELETON",
e))(de || {})
  , g = (e => (e.AbandonedCamp = "abandonedCamp",
e.BastionRemnant = "bastionRemnant",
e.BuriedTreasure = "buriedTreasure",
e.Dungeon = "dungeon",
e.EndCity = "endCity",
e.NetherFortress = "netherFortress",
e.SlimeChunk = "slimeChunk",
e.Stronghold = "stronghold",
e.Village = "village",
e.Mineshaft = "mineshaft",
e.WoodlandMansion = "woodlandMansion",
e.PillagerOutpost = "pillagerOutpost",
e.OceanRuin = "oceanRuin",
e.OceanMonument = "oceanMonument",
e.Shipwreck = "shipwreck",
e.DesertTemple = "desertTemple",
e.JungleTemple = "jungleTemple",
e.WitchHut = "witchHut",
e.Igloo = "igloo",
e.RuinedPortalOverworld = "ruinedPortalOverworld",
e.RuinedPortalNether = "ruinedPortalNether",
e.Spawn = "spawn",
e.Fossil = "fossil",
e.FossilNether = "fossilNether",
e.Ravine = "ravine",
e.EndGateway = "endGateway",
e.AmethystGeode = "amethystGeode",
e.AncientCity = "ancientCity",
e.ItemOverworld = "itemOverworld",
e.OreVein = "oreVein",
e.Cave = "cave",
e.DesertWell = "desertWell",
e.TrailRuin = "trailRuin",
e.TrialChamber = "trialChamber",
e.LavaPool = "lavaPool",
e))(g || {});
const ue = 0
  , yn = "none"
  , Re = []
  , la = {}
  , $e = C({
    id: 0,
    key: "ocean",
    name: "Ocean",
    category: "ocean",
    temperature: .5,
    precipitation: "rain",
    depth: -1,
    rgb: [0, 0, 112],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , xe = C({
    id: 1,
    key: "plains",
    name: "Plains",
    category: "plains",
    temperature: .8,
    precipitation: "rain",
    depth: .125,
    rgb: [141, 179, 96],
    dimension: y.Overworld,
    displayCategory: "plains"
})
  , q = C({
    id: 2,
    key: "desert",
    name: "Desert",
    category: "desert",
    temperature: 2,
    precipitation: "none",
    depth: .125,
    rgb: [250, 148, 24],
    dimension: y.Overworld,
    displayCategory: "sandy"
})
  , kr = C({
    id: 3,
    key: "windswept_hills",
    name: "Windswept Hills",
    oldNames: ["Mountains"],
    category: "extreme_hills",
    temperature: .2,
    precipitation: "rain",
    depth: 1,
    rgb: [96, 96, 96],
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , At = C({
    id: 4,
    key: "forest",
    name: "Forest",
    category: "forest",
    temperature: .7,
    precipitation: "rain",
    depth: .1,
    rgb: [5, 102, 33],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , _e = C({
    id: 5,
    key: "taiga",
    name: "Taiga",
    category: "taiga",
    temperature: .25,
    precipitation: "rain",
    depth: .2,
    rgb: [11, 102, 89],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , Le = C({
    id: 6,
    key: "swamp",
    name: "Swamp",
    category: "swamp",
    temperature: .8,
    precipitation: "rain",
    depth: -.2,
    rgb: [7, 249, 178],
    dimension: y.Overworld,
    displayCategory: "swamps"
})
  , So = C({
    id: 7,
    key: "river",
    name: "River",
    category: "river",
    temperature: .5,
    precipitation: "rain",
    depth: -.5,
    rgb: [0, 0, 255],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , Co = C({
    id: 8,
    key: "nether_wastes",
    name: "Nether Wastes",
    category: "nether",
    temperature: 2,
    precipitation: "none",
    depth: .1,
    rgb: [191, 59, 59],
    climates: [{
        temperature: 0,
        humidity: 0,
        altitude: 0,
        weirdness: 0,
        offset: 0
    }],
    dimension: y.Nether,
    displayCategory: "nether"
});
C({
    id: 9,
    key: "the_end",
    name: "The End",
    category: "the_end",
    temperature: .5,
    precipitation: "none",
    depth: .1,
    rgb: [128, 128, 255],
    dimension: y.End,
    displayCategory: "end"
});
const qe = C({
    id: 10,
    key: "frozen_ocean",
    name: "Frozen Ocean",
    category: "ocean",
    temperature: 0,
    precipitation: "snow",
    depth: -1,
    rgb: [112, 112, 214],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , To = C({
    id: 11,
    key: "frozen_river",
    name: "Frozen River",
    category: "river",
    temperature: 0,
    precipitation: "snow",
    depth: -.5,
    rgb: [160, 160, 255],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , Be = C({
    id: 12,
    key: "snowy_plains",
    name: "Snowy Plains",
    oldNames: ["Snowy Tundra"],
    category: "icy",
    temperature: 0,
    precipitation: "snow",
    depth: .125,
    rgb: [255, 255, 255],
    dimension: y.Overworld,
    displayCategory: "plains"
})
  , ua = C({
    id: 13,
    name: "Snowy Mountains",
    category: "icy",
    temperature: 0,
    precipitation: "snow",
    depth: .45,
    rgb: [160, 160, 160],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Bo = C({
    id: 14,
    key: "mushroom_fields",
    name: "Mushroom Fields",
    category: "mushroom",
    temperature: .9,
    precipitation: "rain",
    depth: .2,
    rgb: [255, 0, 255],
    dimension: y.Overworld,
    displayCategory: "plains"
})
  , bn = C({
    id: 15,
    name: "Mushroom Fields Shore",
    category: "mushroom",
    temperature: .9,
    precipitation: "rain",
    depth: 0,
    rgb: [160, 0, 255],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , ft = C({
    id: 16,
    key: "beach",
    name: "Beach",
    category: "beach",
    temperature: .8,
    precipitation: "rain",
    depth: 0,
    rgb: [250, 222, 85],
    dimension: y.Overworld,
    displayCategory: "sandy"
})
  , Eo = C({
    id: 17,
    name: "Desert Hills",
    category: "desert",
    temperature: 2,
    precipitation: "none",
    depth: .45,
    rgb: [210, 95, 18],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , wn = C({
    id: 18,
    key: "windswept_forest",
    name: "Windswept Forest",
    oldNames: ["Wooded Hills"],
    category: "forest",
    temperature: .7,
    precipitation: "rain",
    depth: .45,
    rgb: [34, 85, 28],
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , Ft = C({
    id: 19,
    name: "Taiga Hills",
    category: "taiga",
    temperature: .25,
    precipitation: "rain",
    depth: .45,
    rgb: [22, 57, 51],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , fa = C({
    id: 20,
    name: "Mountain Edge",
    category: "extreme_hills",
    temperature: .2,
    precipitation: "rain",
    depth: .8,
    rgb: [114, 120, 154],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , pt = C({
    id: 21,
    key: "jungle",
    name: "Jungle",
    category: "jungle",
    temperature: .95,
    precipitation: "rain",
    depth: .1,
    rgb: [83, 123, 9],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , Ir = C({
    id: 22,
    name: "Jungle Hills",
    category: "jungle",
    temperature: .95,
    precipitation: "rain",
    depth: .45,
    rgb: [44, 66, 5],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , vn = C({
    id: 23,
    key: "sparse_jungle",
    name: "Sparse Jungle",
    oldNames: ["Jungle Edge"],
    category: "jungle",
    temperature: .95,
    precipitation: "rain",
    depth: .1,
    rgb: [98, 139, 23],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , Oe = C({
    id: 24,
    key: "deep_ocean",
    name: "Deep Ocean",
    category: "ocean",
    temperature: .5,
    precipitation: "rain",
    depth: -1.8,
    rgb: [0, 0, 48],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , Vo = C({
    id: 25,
    key: "stony_shore",
    name: "Stony Shore",
    oldNames: ["Stone Shore"],
    category: "none",
    temperature: .2,
    precipitation: "rain",
    depth: .1,
    rgb: [162, 162, 132],
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , dt = C({
    id: 26,
    key: "snowy_beach",
    name: "Snowy Beach",
    category: "beach",
    temperature: .05,
    precipitation: "snow",
    depth: 0,
    rgb: [250, 240, 192],
    dimension: y.Overworld,
    displayCategory: "sandy"
})
  , xn = C({
    id: 27,
    key: "birch_forest",
    name: "Birch Forest",
    category: "forest",
    temperature: .6,
    precipitation: "rain",
    depth: .1,
    rgb: [48, 116, 68],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , ko = C({
    id: 28,
    name: "Birch Forest Hills",
    category: "forest",
    temperature: .6,
    precipitation: "rain",
    depth: .45,
    rgb: [31, 95, 50],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , nt = C({
    id: 29,
    key: "dark_forest",
    name: "Dark Forest",
    category: "forest",
    temperature: .7,
    precipitation: "rain",
    depth: .1,
    rgb: [64, 81, 26],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , Ae = C({
    id: 30,
    key: "snowy_taiga",
    name: "Snowy Taiga",
    category: "taiga",
    temperature: -.5,
    precipitation: "snow",
    depth: .2,
    rgb: [49, 85, 74],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , Sn = C({
    id: 31,
    name: "Snowy Taiga Hills",
    category: "taiga",
    temperature: -.5,
    precipitation: "snow",
    depth: .45,
    rgb: [36, 63, 54],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Pt = C({
    id: 32,
    key: "old_growth_pine_taiga",
    name: "Old Growth Pine Taiga",
    oldNames: ["Giant Tree Taiga"],
    category: "taiga",
    temperature: .3,
    precipitation: "rain",
    depth: .2,
    rgb: [89, 102, 81],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , Io = C({
    id: 33,
    name: "Giant Tree Taiga Hills",
    category: "taiga",
    temperature: .3,
    precipitation: "rain",
    depth: .45,
    rgb: [69, 79, 62],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Oo = C({
    id: 34,
    name: "Wooded Mountains",
    category: "extreme_hills",
    temperature: .2,
    precipitation: "rain",
    depth: 1,
    rgb: [80, 112, 80],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Se = C({
    id: 35,
    key: "savanna",
    name: "Savanna",
    category: "savanna",
    temperature: 1.2,
    precipitation: "none",
    depth: .125,
    rgb: [189, 178, 95],
    dimension: y.Overworld,
    displayCategory: "plains"
})
  , Or = C({
    id: 36,
    key: "savanna_plateau",
    name: "Savanna Plateau",
    category: "savanna",
    temperature: 1,
    precipitation: "none",
    depth: 1.5,
    rgb: [167, 157, 100],
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , Mr = C({
    id: 37,
    key: "badlands",
    name: "Badlands",
    category: "mesa",
    temperature: 2,
    precipitation: "none",
    depth: .1,
    rgb: [217, 69, 21],
    dimension: y.Overworld,
    displayCategory: "sandy"
})
  , Cn = C({
    id: 38,
    key: "wooded_badlands",
    name: "Wooded Badlands",
    oldNames: ["Wooded Badlands Plateau"],
    category: "mesa",
    temperature: 2,
    precipitation: "none",
    depth: 1.5,
    rgb: [176, 151, 101],
    dimension: y.Overworld,
    displayCategory: "sandy"
})
  , Mo = C({
    id: 39,
    name: "Badlands Plateau",
    category: "mesa",
    temperature: 2,
    precipitation: "none",
    depth: 1.5,
    rgb: [202, 140, 101],
    dimension: y.Overworld,
    displayCategory: "legacy"
});
C({
    id: 40,
    key: "small_end_islands",
    name: "Small End Islands",
    category: "the_end",
    temperature: .5,
    precipitation: "none",
    depth: .1,
    rgb: [0, 0, 42],
    dimension: y.End,
    displayCategory: "end"
});
const da = C({
    id: 41,
    key: "end_midlands",
    name: "End Midlands",
    category: "the_end",
    temperature: .5,
    precipitation: "none",
    depth: .1,
    rgb: [235, 248, 182],
    dimension: y.End,
    displayCategory: "end"
})
  , Tn = C({
    id: 42,
    key: "end_highlands",
    name: "End Highlands",
    category: "the_end",
    temperature: .5,
    precipitation: "none",
    depth: .1,
    rgb: [195, 189, 137],
    dimension: y.End,
    displayCategory: "end"
});
C({
    id: 43,
    key: "end_barrens",
    name: "End Barrens",
    category: "the_end",
    temperature: .5,
    precipitation: "none",
    depth: .1,
    rgb: [144, 144, 114],
    dimension: y.End,
    displayCategory: "end"
});
const Bt = C({
    id: 44,
    key: "warm_ocean",
    name: "Warm Ocean",
    category: "ocean",
    temperature: .5,
    precipitation: "rain",
    depth: -1,
    rgb: [0, 0, 172],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , Et = C({
    id: 45,
    key: "lukewarm_ocean",
    name: "Lukewarm Ocean",
    category: "ocean",
    temperature: .5,
    precipitation: "rain",
    depth: -1,
    rgb: [0, 0, 144],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , Vt = C({
    id: 46,
    key: "cold_ocean",
    name: "Cold Ocean",
    category: "ocean",
    temperature: .5,
    precipitation: "rain",
    depth: -1,
    rgb: [32, 32, 112],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , Rt = C({
    id: 47,
    key: "deep_warm_ocean",
    name: "Deep Warm Ocean",
    category: "ocean",
    temperature: .5,
    precipitation: "rain",
    depth: -1.8,
    rgb: [0, 0, 80],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , _t = C({
    id: 48,
    key: "deep_lukewarm_ocean",
    name: "Deep Lukewarm Ocean",
    category: "ocean",
    temperature: .5,
    precipitation: "rain",
    depth: -1.8,
    rgb: [0, 0, 64],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , mt = C({
    id: 49,
    key: "deep_cold_ocean",
    name: "Deep Cold Ocean",
    category: "ocean",
    temperature: .5,
    precipitation: "rain",
    depth: -1.8,
    rgb: [32, 32, 56],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , Qe = C({
    id: 50,
    key: "deep_frozen_ocean",
    name: "Deep Frozen Ocean",
    category: "ocean",
    temperature: .5,
    precipitation: "rain",
    depth: -1.8,
    rgb: [64, 64, 144],
    dimension: y.Overworld,
    displayCategory: "water"
})
  , zt = C({
    id: 129,
    name: "Sunflower Plains",
    key: "sunflower_plains",
    category: "plains",
    temperature: .8,
    precipitation: "rain",
    depth: .125,
    rgb: [181, 219, 136],
    parent: xe.id,
    dimension: y.Overworld,
    displayCategory: "plains"
})
  , ga = C({
    id: 130,
    name: "Desert Lakes",
    category: "desert",
    temperature: 2,
    precipitation: "none",
    depth: .125,
    rgb: [255, 188, 64],
    parent: q.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Ao = C({
    id: 131,
    key: "windswept_gravelly_hills",
    name: "Windswept Gravelly Hills",
    oldNames: ["Gravelly Mountains"],
    category: "extreme_hills",
    temperature: .2,
    precipitation: "rain",
    depth: 1,
    rgb: [136, 136, 136],
    parent: kr.id,
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , Ar = C({
    id: 132,
    key: "flower_forest",
    name: "Flower Forest",
    category: "forest",
    temperature: .7,
    precipitation: "rain",
    depth: .1,
    rgb: [45, 142, 73],
    parent: At.id,
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , _a = C({
    id: 133,
    name: "Taiga Mountains",
    category: "taiga",
    temperature: .25,
    precipitation: "rain",
    depth: .3,
    rgb: [51, 142, 129],
    parent: _e.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Fo = C({
    id: 134,
    name: "Swamp Hills",
    category: "swamp",
    temperature: .8,
    precipitation: "rain",
    depth: -.1,
    rgb: [47, 255, 218],
    parent: Le.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Po = C({
    id: 140,
    key: "ice_spikes",
    name: "Ice Spikes",
    category: "icy",
    temperature: 0,
    precipitation: "snow",
    depth: .425,
    rgb: [180, 220, 220],
    parent: Be.id,
    dimension: y.Overworld,
    displayCategory: "plains"
})
  , ma = C({
    id: 149,
    name: "Modified Jungle",
    category: "jungle",
    temperature: .95,
    precipitation: "rain",
    depth: .2,
    rgb: [123, 163, 49],
    parent: pt.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , ha = C({
    id: 151,
    name: "Modified Jungle Edge",
    category: "jungle",
    temperature: .95,
    precipitation: "rain",
    depth: .2,
    rgb: [138, 179, 63],
    parent: vn.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Bn = C({
    id: 155,
    key: "old_growth_birch_forest",
    name: "Old Growth Birch Forest",
    oldNames: ["Tall Birch Forest"],
    category: "forest",
    temperature: .6,
    precipitation: "rain",
    depth: .2,
    rgb: [88, 156, 108],
    parent: xn.id,
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , pa = C({
    id: 156,
    name: "Tall Birch Hills",
    category: "forest",
    temperature: .6,
    precipitation: "rain",
    depth: .55,
    rgb: [71, 135, 90],
    parent: ko.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Lt = C({
    id: 157,
    name: "Dark Forest Hills",
    category: "forest",
    temperature: .7,
    precipitation: "rain",
    depth: .2,
    rgb: [104, 121, 66],
    parent: nt.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , ya = C({
    id: 158,
    name: "Snowy Taiga Mountains",
    category: "taiga",
    temperature: -.5,
    precipitation: "snow",
    depth: .3,
    rgb: [89, 125, 114],
    parent: Ae.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , En = C({
    id: 160,
    key: "old_growth_spruce_taiga",
    name: "Old Growth Spruce Taiga",
    oldNames: ["Giant Spruce Taiga"],
    category: "taiga",
    temperature: .25,
    precipitation: "rain",
    depth: .2,
    rgb: [129, 142, 121],
    parent: Pt.id,
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , ba = C({
    id: 161,
    name: "Giant Spruce Taiga Hills",
    category: "taiga",
    temperature: .25,
    precipitation: "rain",
    depth: .2,
    rgb: [109, 119, 102],
    parent: Io.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , wa = C({
    id: 162,
    name: "Gravelly Mountains+",
    category: "extreme_hills",
    temperature: .2,
    precipitation: "rain",
    depth: 1,
    rgb: [120, 152, 120],
    parent: Oo.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Ro = C({
    id: 163,
    key: "windswept_savanna",
    name: "Windswept Savanna",
    oldNames: ["Shattered Savanna"],
    category: "savanna",
    temperature: 1.1,
    precipitation: "none",
    depth: .3625,
    rgb: [229, 218, 135],
    parent: Se.id,
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , va = C({
    id: 164,
    name: "Shattered Savanna Plateau",
    category: "savanna",
    temperature: 1,
    precipitation: "none",
    rgb: [207, 197, 140],
    depth: 1.05,
    parent: Or.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , zo = C({
    id: 165,
    key: "eroded_badlands",
    name: "Eroded Badlands",
    category: "mesa",
    temperature: 2,
    precipitation: "none",
    depth: .1,
    rgb: [255, 109, 61],
    parent: Mr.id,
    dimension: y.Overworld,
    displayCategory: "sandy"
})
  , xa = C({
    id: 166,
    name: "Modified Wooded Badlands Plateau",
    category: "mesa",
    temperature: 2,
    precipitation: "none",
    depth: .45,
    rgb: [216, 191, 141],
    parent: Cn.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Sa = C({
    id: 167,
    name: "Modified Badlands Plateau",
    category: "mesa",
    temperature: 2,
    precipitation: "none",
    depth: .45,
    rgb: [242, 180, 141],
    parent: Mo.id,
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Vn = C({
    id: 168,
    key: "bamboo_jungle",
    name: "Bamboo Jungle",
    category: "jungle",
    temperature: .95,
    precipitation: "rain",
    depth: .1,
    rgb: [118, 142, 20],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , Lo = C({
    id: 169,
    name: "Bamboo Jungle Hills",
    category: "jungle",
    temperature: .95,
    precipitation: "rain",
    depth: .45,
    rgb: [59, 71, 10],
    dimension: y.Overworld,
    displayCategory: "legacy"
})
  , Ca = C({
    id: 170,
    key: "soul_sand_valley",
    name: "Soul Sand Valley",
    category: "nether",
    temperature: 2,
    precipitation: "none",
    depth: .1,
    rgb: [94, 56, 48],
    climates: [{
        temperature: 0,
        humidity: -.5,
        altitude: 0,
        weirdness: 0,
        offset: 0
    }],
    dimension: y.Nether,
    displayCategory: "nether"
})
  , Ta = C({
    id: 171,
    key: "crimson_forest",
    name: "Crimson Forest",
    category: "nether",
    temperature: 2,
    precipitation: "none",
    depth: .1,
    rgb: [221, 8, 8],
    climates: [{
        temperature: .4,
        humidity: 0,
        altitude: 0,
        weirdness: 0,
        offset: 0
    }],
    dimension: y.Nether,
    displayCategory: "nether"
})
  , Ba = C({
    id: 172,
    key: "warped_forest",
    name: "Warped Forest",
    category: "nether",
    temperature: 2,
    precipitation: "none",
    depth: .1,
    rgb: [73, 144, 123],
    climates: [{
        temperature: 0,
        humidity: .5,
        altitude: 0,
        weirdness: 0,
        offset: .375
    }],
    dimension: y.Nether,
    displayCategory: "nether"
});
C({
    id: 173,
    key: "basalt_deltas",
    name: "Basalt Deltas",
    category: "nether",
    temperature: 2,
    precipitation: "none",
    depth: .1,
    rgb: [64, 54, 54],
    climates: [{
        temperature: -.5,
        humidity: 0,
        altitude: 0,
        weirdness: 0,
        offset: .175
    }],
    dimension: y.Nether,
    displayCategory: "nether"
});
const kn = C({
    id: 174,
    key: "dripstone_caves",
    name: "Dripstone Caves",
    category: "none",
    temperature: .8,
    precipitation: "rain",
    depth: ue,
    rgb: [193, 165, 143],
    dimension: y.Overworld,
    displayCategory: "caves"
})
  , In = C({
    id: 175,
    key: "lush_caves",
    name: "Lush Caves",
    category: "none",
    temperature: .5,
    precipitation: "rain",
    depth: ue,
    rgb: [223, 150, 52],
    dimension: y.Overworld,
    displayCategory: "caves"
})
  , rt = C({
    id: 177,
    key: "meadow",
    name: "Meadow",
    category: "mountain",
    temperature: .5,
    precipitation: "rain",
    depth: ue,
    rgb: [140, 164, 112],
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , Fr = C({
    id: 178,
    key: "grove",
    name: "Grove",
    category: "forest",
    temperature: -.2,
    precipitation: "snow",
    depth: ue,
    rgb: [146, 178, 160],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , On = C({
    id: 179,
    key: "snowy_slopes",
    name: "Snowy Slopes",
    category: "mountain",
    temperature: -.3,
    precipitation: "snow",
    depth: ue,
    rgb: [218, 241, 241],
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , Pr = C({
    id: 180,
    key: "frozen_peaks",
    name: "Frozen Peaks",
    category: "mountain",
    temperature: -.7,
    precipitation: "snow",
    depth: ue,
    rgb: [234, 251, 251],
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , Rr = C({
    id: 181,
    key: "jagged_peaks",
    name: "Jagged Peaks",
    category: "mountain",
    temperature: -.7,
    precipitation: "snow",
    depth: ue,
    rgb: [186, 188, 182],
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , zr = C({
    id: 182,
    key: "stony_peaks",
    name: "Stony Peaks",
    category: "mountain",
    temperature: 1,
    precipitation: "rain",
    depth: ue,
    rgb: [209, 209, 209],
    dimension: y.Overworld,
    displayCategory: "mountains"
})
  , kt = C({
    id: 183,
    key: "deep_dark",
    name: "Deep Dark",
    category: "none",
    temperature: .8,
    precipitation: "rain",
    depth: ue,
    rgb: [0, 0, 0],
    dimension: y.Overworld,
    displayCategory: "caves"
})
  , No = C({
    id: 184,
    key: "mangrove_swamp",
    name: "Mangrove Swamp",
    category: "none",
    temperature: .8,
    precipitation: "rain",
    depth: ue,
    rgb: [36, 196, 142],
    dimension: y.Overworld,
    displayCategory: "swamps"
})
  , Lr = C({
    id: 185,
    key: "cherry_grove",
    name: "Cherry Grove",
    category: "mountain",
    temperature: .5,
    precipitation: yn,
    depth: ue,
    rgb: [247, 185, 220],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , Mn = C({
    id: 186,
    key: "pale_garden",
    name: "Pale Garden",
    category: "forest",
    temperature: .7,
    precipitation: yn,
    depth: ue,
    rgb: [108, 111, 150],
    dimension: y.Overworld,
    displayCategory: "woodlands"
})
  , An = C({
    id: 187,
    key: "sulfur_caves",
    name: "Sulfur Caves",
    category: "none",
    temperature: .8,
    precipitation: yn,
    depth: ue,
    rgb: [200, 200, 40],
    dimension: y.Overworld,
    displayCategory: "caves"
})
  , Ea = C({
    id: 188,
    key: "dappled_forest",
    name: "Dappled Forest",
    category: "forest",
    temperature: .6,
    precipitation: yn,
    depth: ue,
    rgb: [154, 63, 53],
    dimension: y.Overworld,
    displayCategory: "woodlands"
});
function C(e) {
    return Re[e.id] = e,
    e.parent != null && (la[e.parent] = e.id),
    e
}
function ze(e) {
    return e >= 0 && e <= Re.length ? Re[e] : $e
}
function Va(e) {
    return ka(e) ? "caveDepth" : Ia(e) ? "bottom" : "depth0"
}
function ka(e) {
    return [In.id, kn.id, An.id].includes(e)
}
function Ia(e) {
    return e === kt.id
}
function be(e) {
    if (typeof e.seed == "string")
        throw new Error("toRustWorld received a PlainWorld — call fromPlainWorld() first");
    return new ae(e.seed.low,e.seed.high,e.edition === h.Java ? ri.Java : ri.Bedrock,e.edition === h.Java ? e.javaVersion : e.bedrockVersion,e.config.biomeSize,!!e.config.largeBiomes)
}
class Oa {
    provider;
    constructor(t) {
        const n = be(t);
        this.provider = new er(n)
    }
    getInts(t, n, r, i) {
        return this.provider.get_ints0(t, n, r, i)
    }
    getInts1(t, n, r, i) {
        return this.provider.get_ints1(t, n, r, i)
    }
    free() {
        this.provider.free()
    }
}
class Ma {
    provider;
    constructor(t) {
        const n = be(t);
        this.provider = new tr(n)
    }
    getChunkBiome(t, n) {
        return this.provider.get_chunk_biome(t, n)
    }
    getNoiseBiome(t, n) {
        return this.provider.get_noise_biome(t, n)
    }
    getBiomeArea(t, n, r, i, o) {
        return this.provider.get_biome_area(t, n, r, i, o)
    }
    free() {
        this.provider.free()
    }
}
class ee {
    rng;
    constructor(t) {
        const n = typeof t == "number" ? V.fromInt(t) : t;
        this.rng = new Yn(n.low,n.high)
    }
    setSeed(t) {
        const n = typeof t == "number" ? V.fromInt(t) : t;
        this.rng.set_seed(n.low, n.high)
    }
    nextInt(t) {
        return t == null ? this.rng.next_int_unbound() : this.rng.next_int(t)
    }
    nextIntRaw() {
        return this.rng.next_int_raw()
    }
    nextIntRange(t, n) {
        return this.rng.next_int_range(t, n)
    }
    nextFloat() {
        return this.rng.next_float()
    }
    nextDouble() {
        return this.rng.next_double()
    }
    nextBoolean() {
        return this.rng.next_boolean()
    }
    free() {
        this.rng.free()
    }
}
const Bi = e => e.map(t => [t.x, t.y, t.z, de[t.dungeon_type]]);
class Aa {
    rustFinder;
    constructor(t) {
        this.rustFinder = new ir(be(t))
    }
    find(t, n) {
        return Bi(this.rustFinder.find(t.provider, n.x, n.z, n.sizeX, n.sizeZ))
    }
    findLegacy(t) {
        return Bi(this.rustFinder.find_legacy(t.x, t.z, t.sizeX, t.sizeZ))
    }
    free() {
        this.rustFinder.free()
    }
}
class ge {
    rng;
    constructor(t=V.ZERO) {
        this.rng = new or(t.low,t.high)
    }
    setSeed(t) {
        this.rng.set_seed(t.low, t.high)
    }
    getSeed() {
        const t = Array.from(this.rng.get_seed());
        return V.fromBits(t[0], t[1])
    }
    restoreSeed(t) {
        this.rng.restore_seed(t.low, t.high)
    }
    nextInt(t) {
        return t == null ? this.rng.next_int_unbound() : this.rng.next_int(t)
    }
    nextIntVoid(t) {
        if (t == null) {
            this.rng.skip_next_n(1);
            return
        }
        this.rng.next_int(t)
    }
    nextLong() {
        const t = Array.from(this.rng.next_long());
        return V.fromBits(t[0], t[1])
    }
    nextLongVoid() {
        this.rng.next_long()
    }
    nextFloat() {
        return this.rng.next_float()
    }
    nextFloatVoid() {
        this.rng.next_float()
    }
    nextDouble() {
        return this.rng.next_double()
    }
    nextDoubleVoid() {
        this.rng.next_double()
    }
    nextBoolean() {
        return this.rng.next_boolean()
    }
    _next(t) {
        return this.rng.next(t)
    }
    _nextVoid() {
        this.rng.skip_next_n(1)
    }
    consumeCount(t) {
        this.rng.skip_next_n(t)
    }
    free() {
        this.rng.free()
    }
}
class Fa {
    chunkGen;
    constructor(t) {
        const n = be(t);
        this.chunkGen = new rr(n)
    }
    buildHeightmap(t, n) {
        return this.chunkGen.build_height_map(t, n)
    }
    free() {
        this.chunkGen.free()
    }
}
class It {
    rng;
    constructor(t) {
        this.rng = t
    }
    static fromLoHi(t, n) {
        return new It(new Xe(t.low,t.high,n.low,n.high))
    }
    static fromSeed(t) {
        return new It(Xe.new_from_seed(t.low, t.high))
    }
    setSeed(t) {
        this.rng.set_seed(t.low, t.high)
    }
    nextInt(t) {
        return this.rng.next_int(t)
    }
    nextLong() {
        const t = Array.from(this.rng.next_long());
        return V.fromBits(t[0], t[1])
    }
    nextFloat() {
        return this.rng.next_float()
    }
    nextDouble() {
        return this.rng.next_double()
    }
    skipNextN(t) {
        return this.rng.skip_next_n(t)
    }
    free() {
        this.rng.free()
    }
}
class Pa {
    rustFinder;
    constructor(t) {
        this.rustFinder = new lr(be(t))
    }
    find(t, n) {
        return this.rustFinder.find(n.provider, t.x, t.z, t.sizeX, t.sizeZ).map(r => ({
            min: r.min,
            max: r.max,
            reference: r.reference,
            count: r.count,
            type: r.vein_type === "COPPER" ? "copper" : "iron",
            oreCount: r.ore_count
        }))
    }
    free() {
        this.rustFinder.free()
    }
}
const je = {
    caveDepth: bt.CAVE_DEPTH,
    worldSurface: bt.WORLD_SURFACE,
    oceanFloor: bt.OCEAN_FLOOR,
    bottom: bt.BOTTOM,
    depth0: bt.DEPTH0
}
  , Jt = {
    fastApproximate: Gt.FAST_APPROXIMATE,
    enhanced: Gt.ENHANCED,
    enhancedNoCaves: Gt.ENHANCED_NOCAVES,
    topmostAccurate: Gt.TOPMOST_ACCURATE
};
class ht {
    provider;
    static newOverworld(t) {
        const n = se.new_overworld(be(t));
        return new ht(n)
    }
    static newNether(t) {
        const n = se.new_nether(be(t));
        return new ht(n)
    }
    constructor(t) {
        this.provider = t
    }
    getNoiseBiome(t, n, r) {
        return this.provider.get_noise_biome(t, n, r)
    }
    getNoiseBiomeBlock(t, n, r) {
        return this.provider.get_noise_biome_block(t, n, r)
    }
    getNoiseBiomeAtHeightType(t, n, r) {
        return this.provider.get_noise_biome_at_height_type(t, n, je[r])
    }
    getSurface(t, n, r, i) {
        return this.provider.get_surface(t, n, je[r], Jt[i])
    }
    getSurfaceBlock(t, n, r, i) {
        return this.provider.get_surface_block(t, n, je[r], Jt[i])
    }
    getSurfaceArea(t, n, r, i, o, s, a) {
        return this.provider.get_surface_area(t, n, r, i, o, je[s], Jt[a])
    }
    getNoiseBiomeArea(t, n, r, i, o, s, a) {
        return this.provider.get_noise_biome_area(t, n, r, i, o, s, a)
    }
    getNoiseBiomeAreaAtHeightType(t, n, r, i, o, s) {
        return this.provider.get_noise_biome_area_at_height_type(t, n, r, i, o, je[s])
    }
    findSpawnPosition() {
        return Array.from(this.provider.find_spawn_position())
    }
    getPreliminarySurfaceLevel(t, n) {
        return Math.min(312, Math.max(-64, this.provider.get_preliminary_surface_level(t, n)))
    }
    getNoiseBlock(t, n, r, i) {
        return this.provider.get_noise_block(t, n, r, i)
    }
    getNoiseBiomeYColumn(t, n, r) {
        return this.provider.get_noise_biome_y_column(t, n, r)
    }
    getNoiseBiomeAreaAtHeightTypeWithSurface(t, n, r, i, o, s, a, c) {
        const l = this.provider.get_noise_biome_area_at_height_type_with_surface(t, n, r, i, o, je[s], je[a], Jt[c])
          , u = r * i;
        return {
            biomes: l.slice(0, u),
            heights: l.slice(u)
        }
    }
    free() {
        this.provider.free()
    }
}
function Ra(e) {
    return e === St.Stone || e === St.DefaultCaveStone
}
function za(e, t, n, r, i, o, s) {
    const a = t >> 2
      , c = n >> 2
      , l = r >> 2
      , u = i >> 2;
    let d = null
      , f = 0;
    for (let _ = -u; _ <= u; _++)
        for (let p = -u; p <= u; p++) {
            const w = a + p
              , v = l + _
              , T = ze(e.getNoiseBiome(w, c, v));
            o(T) && ((d == null || s.nextInt(f + 1) === 0) && (d = [w << 2, n, v << 2]),
            f += 1)
        }
    return d
}
class Nr {
    static getBiome(t, n, r) {
        return new Nr(t).getBiomeAtChunk(n, r)
    }
    provider;
    constructor(t) {
        this.provider = new Ma(t)
    }
    getBiomeAtChunk(t, n) {
        return ze(this.provider.getChunkBiome(t, n))
    }
    getNoiseBiome(t, n, r) {
        return this.provider.getNoiseBiome(t, r)
    }
    getBiomeArea(t, n, r, i, o) {
        return this.provider.getBiomeArea(t, n, r, i, o)
    }
    free() {
        this.provider.free()
    }
}
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
function Do(e, t, n) {
    const r = e.javaVersion >= m.V1_18 ? It.fromSeed(e.seed) : new ge(e.seed)
      , i = r.nextLong().or(V.ONE)
      , o = r.nextLong().or(V.ONE);
    return r.free(),
    V.fromNumber(t).multiply(i).add(V.fromNumber(n).multiply(o)).xor(e.seed)
}
function gn(e) {
    return e >= 0 ? Math.floor(e) : Math.ceil(e)
}
function Ha(e) {
    return (t, n, r, i) => {
        const o = t - r >> 2
          , s = n - r >> 2
          , a = t + r >> 2
          , c = n + r >> 2
          , l = a - o + 1
          , u = c - s + 1
          , d = e(o, s, l, u);
        for (let f = 0; f < l * u; ++f) {
            const _ = ze(d[f]);
            if (!i.includes(_))
                return !1
        }
        return !0
    }
}
function Da(e, t, n, r, i, o) {
    const s = o.map(d => d.id)
      , a = t - i >> 2
      , c = r - i >> 2
      , l = t + i >> 2
      , u = r + i >> 2;
    for (let d = c; d <= u; d++)
        for (let f = a; f <= l; f++) {
            const _ = e.getNoiseBiome(f, n >> 2, d);
            if (!s.includes(_))
                return !1
        }
    return !0
}
class Wo {
    constructor(t) {
        this.world = t,
        this.provider = new Oa(t)
    }
    provider;
    getBiomeGenAt(t, n, r, i) {
        this.assertBedrockOrJava115OrLess();
        const o = []
          , s = this.provider.getInts1(t, n, r, i);
        for (let a = 0; a < r * i; ++a)
            o[a] = ze(s[a]);
        return o
    }
    getInts(t, n, r, i) {
        return this.provider.getInts(t, n, r, i)
    }
    getInts1(t, n, r, i) {
        return this.assertBedrockOrJava115OrLess(),
        this.provider.getInts1(t, n, r, i)
    }
    findBiomePosition(t, n, r, i, o) {
        const s = t - r >> 2
          , a = n - r >> 2
          , c = t + r >> 2
          , l = n + r >> 2
          , u = c - s + 1
          , d = l - a + 1
          , f = this.provider.getInts(s, a, u, d);
        let _ = null
          , p = 0;
        for (let w = 0; w < u * d; ++w) {
            const v = s + w % u << 2
              , T = a + gn(w / u) << 2
              , B = ze(f[w]);
            if (!i.includes(B))
                continue;
            let k = _ == null;
            k || (k = o.nextInt(p + 1) === 0),
            k && (_ = [v, 0, T]),
            (k || this.world.edition === h.Bedrock || this.world.javaVersion >= m.V1_13) && ++p
        }
        return _
    }
    assertJava116Plus() {
        if (this.world.edition !== h.Java || this.world.javaVersion < m.V1_16)
            throw new Error("method is only meant to be used with Java 1.16+")
    }
    assertBedrockOrJava115OrLess() {
        if (this.world.edition === h.Java && this.world.javaVersion >= m.V1_16)
            throw new Error("method should not be used with Java 1.16+")
    }
    getNoiseBiome(t, n) {
        return this.assertJava116Plus(),
        ze(this.provider.getInts(t, n, 1, 1)[0])
    }
    getBiomeForStructure(t, n) {
        return this.world.edition === h.Bedrock || this.world.javaVersion < m.V1_13 ? this.getBiomeGenAt(t * 16 + 8, n * 16 + 8, 1, 1)[0] : this.world.javaVersion < m.V1_16 ? this.getBiomeGenAt(t * 16 + 9, n * 16 + 9, 1, 1)[0] : this.getNoiseBiome((t << 2) + 2, (n << 2) + 2)
    }
    _getBiomeArea(t, n, r, i, o) {
        const s = r - t + 1
          , a = i - n + 1
          , c = o(t, n, s, a);
        return (l, u) => {
            if (l < t || l > r || u < n || u > i)
                throw new Error("biome access out of bounds");
            const d = l - t
              , f = u - n
              , _ = d + f * s;
            return ze(c[_])
        }
    }
    getNoiseBiomeArea(t, n, r, i) {
        return this._getBiomeArea(t, n, r, i, this.provider.getInts.bind(this.provider))
    }
    getBiomeArea(t, n, r, i) {
        return this.assertBedrockOrJava115OrLess(),
        this._getBiomeArea(t, n, r, i, this.provider.getInts1.bind(this.provider))
    }
    areBiomesViable = Ha( (...t) => this.provider.getInts(...t));
    free() {
        this.provider.free()
    }
}
function Hr(e) {
    return e.edition === h.Java && e.javaVersion >= m.V1_18 || e.edition === h.Bedrock && e.bedrockVersion >= x.V1_18
}
function jo(e) {
    return e.edition === h.Java && e.javaVersion >= m.V1_16 || e.edition === h.Bedrock && e.bedrockVersion >= x.V1_16
}
class Go {
    biomeId;
    constructor(t) {
        this.biomeId = t
    }
    getBiome() {
        return this.biomeId
    }
    free() {}
}
const Wa = e => {
    if (Hr(e)) {
        const t = Object.assign(ht.newOverworld(e), {
            legacy: () => {
                throw new Error("Wrong biome provider")
            }
            ,
            noise: () => t
        });
        return t
    } else {
        const t = Object.assign(new Wo(e), {
            legacy: () => t,
            noise: () => {
                throw new Error("Wrong biome provider")
            }
        });
        return t
    }
}
  , ja = e => {
    if (jo(e)) {
        const t = Object.assign(ht.newNether(e), {
            legacy: () => {
                throw new Error("Wrong biome provider")
            }
            ,
            noise: () => t
        });
        return t
    } else {
        const t = Object.assign(new Go(Co.id), {
            legacy: () => t,
            noise: () => {
                throw new Error("Wrong biome provider")
            }
        });
        return t
    }
}
;
function Ga(e, t, n) {
    return new ee(Ja(e, t, n))
}
function Ja(e, t, n) {
    return Fn(e)(t, n)
}
function Fn(e) {
    const t = new ee(e.seed)
      , r = t.nextInt() | 1
      , o = t.nextInt() | 1;
    t.free();
    const s = e.seed.toInt();
    return function(a, c) {
        return s ^ Math.imul(o, c) + Math.imul(r, a)
    }
}
const Me = ze
  , gr = (e, t, n) => Math.min(n, Math.max(t, e));
function _r(e) {
    return e.edition === h.Java ? ["java", e.seed.toString(), e.javaVersion, e.config.flat ?? !1, e.config.biomeSize ?? null, e.config.largeBiomes ?? !1].join("//") : ["bedrock", e.seed.toString(), e.bedrockVersion, e.config.flat ?? !1, e.config.biomeSize ?? null, e.config.largeBiomes ?? !1].join("//")
}
function Nt(e) {
    return {
        ...e,
        seed: V.fromString(e.seed)
    }
}
const Ua = [208, 227, 240];
function Za(e, t, n) {
    let r = "", i, o = !1;
    return s => {
        const a = n(s);
        return o && a === r || (r = a,
        o && t(i),
        i = e(s),
        o = !0),
        i
    }
}
function Ne(e, {x: t, z: n}) {
    return t >= e.x && t < e.x + e.sizeX && n >= e.z && n < e.z + e.sizeZ
}
function yt(e, t={}) {
    const {x0: n=0, x1: r=0, z0: i=0, z1: o=0} = t;
    return {
        x: e.x + n,
        z: e.z + i,
        sizeX: e.sizeX - n + r,
        sizeZ: e.sizeZ - i + o
    }
}
function Dr(e, t) {
    const n = ki({
        x: e.x,
        z: e.z
    }, t)
      , r = ki({
        x: e.x + e.sizeX - 1,
        z: e.z + e.sizeZ - 1
    }, t);
    return {
        x: n.x,
        z: n.z,
        sizeX: r.x - n.x + 1,
        sizeZ: r.z - n.z + 1
    }
}
function ki(e, t) {
    return {
        x: Math.floor(e.x / t),
        z: Math.floor(e.z / t)
    }
}
function ie(e, t) {
    for (let n = e.z; n < e.z + e.sizeZ; n++)
        for (let r = e.x; r < e.x + e.sizeX; r++)
            t(r, n)
}
async function Jo(e, t) {
    for (let n = e.z; n < e.z + e.sizeZ; n++)
        for (let r = e.x; r < e.x + e.sizeX; r++)
            await t(r, n)
}
function Uo(e, t) {
    const n = [];
    return ie(e, (r, i) => {
        t(r, i) && n.push([r, i])
    }
    ),
    n
}
function Ka(e, t) {
    const n = [];
    return ie(e, (r, i) => {
        n.push(...t(r, i))
    }
    ),
    n
}
function Xa(e, t) {
    return `${e},${t}`
}
function $a(e) {
    return e.split(",").map(t => parseInt(t, 10))
}
function Fe(e, t) {
    const n = e.reduce( (r, i) => {
        const [o,s] = t(i)
          , a = Xa(o, s);
        return r[a] || (r[a] = []),
        r[a].push(i),
        r
    }
    , {});
    return Object.entries(n).map( ([r,i]) => {
        const [o,s] = $a(r);
        return [o, s, i]
    }
    )
}
function Zo(e, t, n) {
    const r = e.filter(i => {
        const o = n(i);
        return Ne(t, {
            x: o[0],
            z: o[1]
        })
    }
    );
    return Fe(r, n)
}
function qa(e, t, n, r) {
    const i = Math.floor(t / r.spacing)
      , o = Math.floor(n / r.spacing)
      , {rng: s, chunkX: a, chunkZ: c} = Ko(e, i, o, r);
    return {
        rng: s,
        isFeatureChunk: a === t && c === n
    }
}
function Ko(e, t, n, r) {
    const i = Ho(e, t, n, r.salt, r.forceRngType);
    let o, s;
    r.linearSeparation ? (o = i.nextInt(r.spacing - r.separation),
    s = i.nextInt(r.spacing - r.separation)) : (o = gn((i.nextInt(r.spacing - r.separation) + i.nextInt(r.spacing - r.separation)) / 2),
    s = gn((i.nextInt(r.spacing - r.separation) + i.nextInt(r.spacing - r.separation)) / 2));
    const a = t * r.spacing + o
      , c = n * r.spacing + s;
    return {
        chunkX: a,
        chunkZ: c,
        rng: i
    }
}
function J(e, t, n, r, i, o, s) {
    return async a => {
        const c = []
          , l = i ? yt(a, i) : a
          , u = Dr(l, t.spacing);
        if (await Jo(u, async (_, p) => {
            const {chunkX: w, chunkZ: v, rng: T} = Ko(e, _, p, t);
            try {
                if (!Ne(l, {
                    x: w,
                    z: v
                }))
                    return;
                const B = await n(w, v, T);
                if (!B)
                    return;
                r ? c.push([w, v, r(w, v, T, B)]) : c.push([w, v])
            } finally {
                T.free()
            }
        }
        ),
        !o)
            return c;
        const d = c.map(_ => _[2]).filter(Boolean)
          , f = Fe(d, o).filter(_ => Ne(a, {
            x: _[0],
            z: _[1]
        }));
        return s ? f.map(_ => [_[0], _[1], _[2][0]]) : f
    }
}
async function Qa(e, t, n) {
    return (await J(e, t, async () => !0)(n)).length > 0
}
const Ya = {
    [g.AmethystGeode]: {
        [h.Java]: [m.V1_17, m.V26_3],
        [h.Bedrock]: [x.V1_17, x.V26_40]
    },
    [g.AncientCity]: {
        [h.Java]: [m.V1_19, m.V26_3],
        [h.Bedrock]: [x.V1_19, x.V26_40]
    },
    [g.BastionRemnant]: {
        [h.Java]: [m.V1_16, m.V26_3],
        [h.Bedrock]: [x.V1_16, x.V26_40]
    },
    [g.BuriedTreasure]: {
        [h.Java]: [m.V1_13, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.Cave]: {
        [h.Java]: [m.V1_18, m.V26_3],
        [h.Bedrock]: [x.V1_18, x.V26_40]
    },
    [g.DesertWell]: {
        [h.Java]: [m.V1_18, m.V26_3],
        [h.Bedrock]: [x.V1_18, x.V26_40]
    },
    [g.Dungeon]: {
        [h.Java]: [m.V1_13, m.V26_3],
        [h.Bedrock]: [x.V1_16, x.V26_40]
    },
    [g.EndCity]: {
        [h.Java]: [m.V1_13, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.EndGateway]: {
        [h.Java]: [m.V1_16, m.V26_3],
        [h.Bedrock]: [x.V1_16, x.V26_40]
    },
    [g.Fossil]: {
        [h.Java]: [m.V1_16, m.V26_3],
        [h.Bedrock]: [x.V1_16, x.V26_40]
    },
    [g.FossilNether]: {
        [h.Java]: [m.V1_16, m.V26_3],
        [h.Bedrock]: [x.V1_16, x.V26_40]
    },
    [g.ItemOverworld]: {
        [h.Java]: [m.V1_18, m.V26_3],
        [h.Bedrock]: [x.V1_18, x.V26_40]
    },
    [g.LavaPool]: {
        [h.Java]: [m.V1_18, m.V26_3],
        [h.Bedrock]: [x.V1_18, x.V26_40]
    },
    [g.Mineshaft]: {
        [h.Java]: [m.V1_7, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.NetherFortress]: {
        [h.Java]: [m.V1_7, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.OceanMonument]: {
        [h.Java]: [m.V1_8, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.OceanRuin]: {
        [h.Java]: [m.V1_16, m.V26_3],
        [h.Bedrock]: [x.V1_16, x.V26_40]
    },
    [g.OreVein]: {
        [h.Java]: [m.V1_18, m.V26_3],
        [h.Bedrock]: [x.V1_18, x.V26_40]
    },
    [g.PillagerOutpost]: {
        [h.Java]: [m.V1_14, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.Ravine]: {
        [h.Java]: [m.V1_16, m.V26_3],
        [h.Bedrock]: [x.V1_16, x.V26_40]
    },
    [g.RuinedPortalOverworld]: {
        [h.Java]: [m.V1_16, m.V26_3],
        [h.Bedrock]: [x.V1_16, x.V26_40]
    },
    [g.RuinedPortalNether]: {
        [h.Java]: [m.V1_16, m.V26_3],
        [h.Bedrock]: [x.V1_16, x.V26_40]
    },
    [g.DesertTemple]: {
        [h.Java]: [m.V1_7, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.JungleTemple]: {
        [h.Java]: [m.V1_7, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.WitchHut]: {
        [h.Java]: [m.V1_7, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.Igloo]: {
        [h.Java]: [m.V1_9, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.Shipwreck]: {
        [h.Java]: [m.V1_13, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.SlimeChunk]: {
        [h.Java]: [m.V1_7, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.Spawn]: {
        [h.Java]: [m.V1_7, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.Stronghold]: {
        [h.Java]: [m.V1_7, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.TrailRuin]: {
        [h.Java]: [m.V1_20, m.V26_3],
        [h.Bedrock]: [x.V1_20, x.V26_40]
    },
    [g.TrialChamber]: {
        [h.Java]: [m.V1_21, m.V26_3],
        [h.Bedrock]: [x.V1_21, x.V26_40]
    },
    [g.Village]: {
        [h.Java]: [m.V1_7, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.WoodlandMansion]: {
        [h.Java]: [m.V1_11, m.V26_3],
        [h.Bedrock]: [x.V1_14, x.V26_40]
    },
    [g.AbandonedCamp]: {
        [h.Java]: [m.V26_3, m.V26_3],
        [h.Bedrock]: [x.V26_40, x.V26_40]
    }
};
function N(e, t) {
    const n = Ya[e][t.edition];
    if (!n)
        return !1;
    const r = t.edition === h.Java ? t.javaVersion : t.bedrockVersion;
    return r >= n[0] && r <= n[1]
}
const Ii = [ (e, t, n) => [e, t, n], (e, t, n) => [-n, t, e], (e, t, n) => [-e, t, -n], (e, t, n) => [n, t, -e]]
  , Xo = (e, t) => {
    const n = e.reduce( (i, o) => i + o[1], 0);
    let r = t.nextInt(n);
    for (const i of e)
        if (r -= i[1],
        r < 0)
            return i;
    throw new Error("Unable to find structure")
}
;
function it({world: e, biomeProvider: t, chunkX: n, chunkZ: r, initialY: i, projectionY: o, allowedBiomes: s, structures: a, namedStartPos: c, mapResult: l}) {
    const u = le(e, n, r, void 0, "java");
    try {
        let d = typeof i == "number" ? i : i({
            rng: u
        });
        const f = Ii[u.nextInt(Ii.length)]
          , _ = Xo(a, u)
          , [p,,w] = _
          , v = a.indexOf(_)
          , T = f(w[0] - 1, w[1] - 1, w[2] - 1);
        let B = [0, 0];
        if (c) {
            if (o)
                throw new Error("not supported");
            const M = f(c[0], 0, c[1]);
            B = [-M[0], -M[2]]
        }
        const k = B[0] + (n * 16 + n * 16 + T[0]) / 2 | 0
          , A = B[1] + (r * 16 + r * 16 + T[2]) / 2 | 0;
        o && (d = d + t.getSurfaceBlock(k, A, o.heightType, o.surfaceCheckType) + 1);
        let P, E = null;
        s === "all" ? P = !0 : (E = Me(t.getNoiseBiome(k >> 2, d >> 2, A >> 2)),
        typeof s == "function" ? P = s(E) : P = s.includes(E));
        const I = d - 1 + T[1] / 2 | 0;
        if (!P)
            return !1;
        const O = {
            key: p,
            x: k,
            y: I,
            z: A,
            yBase: d
        };
        return l ? l(O, {
            rng: u,
            biome: E,
            structureIndex: v
        }) : O
    } finally {
        u.free()
    }
}
const ec = e => (t, n) => {
    const r = e.reduce( (i, o) => i + o.weight, 0);
    return (i, o) => {
        const s = le(t, i, o);
        try {
            let a = [...e]
              , c = r;
            for (; a.length > 0; ) {
                let l = s.nextInt(c)
                  , u = a[0];
                for (const f of a)
                    if (l -= f.weight,
                    l < 0) {
                        u = f;
                        break
                    }
                const d = u.canGenerate(i, o);
                if (d)
                    return u.poi === n ? d : !1;
                c -= u.weight,
                a = a.filter(f => f !== u)
            }
            return !1
        } finally {
            s.free()
        }
    }
}
  , $o = (e, t, n) => ec([{
    poi: g.NetherFortress,
    weight: 2,
    canGenerate: () => !0
}, {
    poi: g.BastionRemnant,
    weight: 3,
    canGenerate: (r, i) => nc(e, t[y.Nether], r, i)
}])(e, n)
  , tc = {
    supportsWorld: e => N(g.BastionRemnant, e),
    create: rc
}
  , mr = [Ta, Co, Ca, Ba];
function Oi(e, t, n, r) {
    if (e.edition === h.Java && e.javaVersion >= m.V1_18) {
        const i = le(e, t, n)
          , o = i.nextInt(5) >= 2;
        return i.free(),
        o
    } else {
        const i = e.edition === h.Bedrock ? 6 : 5;
        return r.nextInt(i) >= 2
    }
}
function nc(e, t, n, r) {
    const i = it({
        world: e,
        biomeProvider: t.noise(),
        chunkX: n,
        chunkZ: r,
        initialY: 33,
        projectionY: null,
        allowedBiomes: mr,
        structures: [["units", 1, [46, 24, 46]], ["hoglin_stable", 1, [30, 24, 48]], ["treasure", 1, [38, 48, 38]], ["bridge", 1, [16, 32, 32]]]
    });
    return i ? i.key : !1
}
async function rc(e, t) {
    const n = t.nether.noise()
      , r = $o(e, t, g.BastionRemnant);
    return J(e, {
        spacing: e.edition === h.Bedrock ? 30 : 27,
        separation: 4,
        salt: 30084232,
        linearSeparation: !0
    }, async (i, o, s) => {
        if (e.edition === h.Java)
            if (e.javaVersion >= m.V1_18) {
                const a = r(i, o);
                return a ? {
                    type: a
                } : !1
            } else {
                if (!Oi(e, i, o, s) || !mr.includes(Me(n.getNoiseBiome(i * 4 + 2, 0, o * 4 + 2))))
                    return !1;
                const a = le(e, i, o);
                a.nextInt(4);
                const c = a.nextInt(4);
                return a.free(),
                {
                    type: ["units", "hoglin_stable", "treasure", "bridge"][c]
                }
            }
        else
            return !Oi(e, i, o, s) || !Da(n, i * 16 + 8, 0, o * 16 + 8, 2, mr) ? !1 : (s.nextInt(4),
            {
                type: ["bridge", "treasure", "hoglin_stable", "units"][s.nextInt(4)]
            })
    }
    , (i, o, s, a) => a)
}
const Ye = (e, t, n, r) => Me(e.getNoiseBiomeAtHeightType(t * 4 + 2, n * 4 + 2, r))
  , Pn = (e, t, n, r) => Me(e.getNoiseBiomeBlock(t, n, r))
  , Ke = (e, t, n, r, i, o) => !!Wr(e, t, n, r, i, o)
  , Wr = (e, t, n, r, i, o) => {
    const s = o.map(A => A.id)
      , a = t - i
      , c = n - i
      , l = r - i
      , u = t + i
      , d = n + i
      , f = r + i;
    let _;
    const p = Math.floor((u - a + 4) / 4)
      , w = a + Math.floor(p / 2) * 4
      , v = Math.floor((d - c + 4) / 4)
      , T = c + Math.floor(v / 2) * 4
      , B = Math.floor((f - l + 4) / 4)
      , k = l + Math.floor(B / 2) * 4;
    for (let A = c; A <= d; A += 4)
        for (let P = a; P <= u; P += 4)
            for (let E = l; E <= f; E += 4) {
                const I = e.getNoiseBiomeBlock(P, A, E);
                if (!s.includes(I))
                    return !1;
                P === w && A === T && E === k && (_ = Me(I))
            }
    return _ ?? Me(e.getNoiseBiomeBlock(t, n, r))
}
  , ic = (e, t, n, r, i) => [[t, n], [t + r, n], [t, n + i], [t + r, n + i]].map(o => e.getSurfaceBlock(o[0], o[1], "worldSurface", "topmostAccurate"))
  , Mi = (e, t, n, r, i) => {
    const o = ic(e, t * 16, n * 16, r, i);
    return Math.min(...o)
}
  , oc = {
    supportsWorld: e => N(g.BuriedTreasure, e),
    create: sc
};
async function sc(e, t) {
    return e.edition === h.Java ? lc(e, t.overworld) : cc(e, t.overworld)
}
const Ai = [ft, dt, Vo, bn]
  , ac = [ft, dt];
function cc(e, t) {
    return J(e, {
        salt: 16842397,
        spacing: 4,
        separation: 2,
        linearSeparation: !1
    }, async (n, r) => {
        if (e.bedrockVersion >= x.V1_18) {
            const i = t.noise()
              , o = i.getPreliminarySurfaceLevel(n * 4, r * 4);
            return Ke(i, n * 16 + 8, o, r * 16 + 8, 3, Ai)
        } else
            return t.legacy().areBiomesViable(n * 16 + 8, r * 16 + 8, 3, Ai)
    }
    )
}
function lc(e, t) {
    return async n => {
        const r = [];
        return ie(n, (i, o) => {
            const s = Ho(e, i, o, 10387320);
            if (s.nextFloat() >= .01) {
                s.free();
                return
            }
            const a = e.javaVersion >= m.V1_18 ? Ye(t.noise(), i, o, "oceanFloor") : t.legacy().getBiomeForStructure(i, o);
            ac.includes(a) && r.push([i, o]),
            s.free()
        }
        ),
        r
    }
}
const jr = (e, t) => async n => {
    if (n.sizeX <= t && n.sizeZ <= t)
        return e(n);
    const r = Dr(n, t)
      , i = [];
    return await Jo(r, async (o, s) => {
        const a = await e({
            x: o * t,
            z: s * t,
            sizeX: t,
            sizeZ: t
        });
        i.push(...a)
    }
    ),
    i.filter(o => Ne(n, {
        x: o[0],
        z: o[1]
    }))
}
;
function qo(e) {
    return async t => async n => Uo(n, (r, i) => e(t, r, i))
}
const Qo = {
    supportsWorld: e => N(g.Mineshaft, e),
    create: qo(uc)
};
function uc(e, t, n) {
    return e.edition === h.Bedrock ? dc(e, t, n) : fc(e, t, n)
}
function fc(e, t, n) {
    const r = le(e, t, n);
    try {
        if (e.javaVersion < m.V1_13 && r.nextIntVoid(),
        r.nextDouble() >= .004)
            return !1;
        if (e.javaVersion >= m.V1_13)
            return !0;
        const i = Math.max(Math.abs(t), Math.abs(n));
        return i >= 80 ? !0 : r.nextInt(80) < i
    } finally {
        r.free()
    }
}
function dc(e, t, n) {
    const r = le(e, t, n);
    if (r.nextInt(),
    r.nextFloat() >= .004)
        return r.free(),
        !1;
    const o = r.nextInt(80) < Math.max(Math.abs(t), Math.abs(n));
    return r.free(),
    o
}
const gc = {
    supportsWorld: e => N(g.Dungeon, e),
    create: async (e, t) => {
        const n = new Aa(e)
          , i = Hr(e) ? t.overworld.noise() : void 0
          , o = e.edition === h.Bedrock ? [await _c(e)] : []
          , s = jr(async c => {
            const l = i ? n.find(i, c) : n.findLegacy(c);
            return Fe(l, u => [u[0] >> 4, u[2] >> 4])
        }
        , 16)
          , a = async c => {
            let l = await s(c);
            for (const u of o)
                l = await u(c, l);
            return l
        }
        ;
        return a.free = () => {
            o.forEach(c => c.free?.()),
            n.free()
        }
        ,
        a
    }
}
  , wt = 6
  , _c = async e => {
    const t = await Qo.create(e)
      , n = async (r, i) => {
        const o = await t(yt(r, {
            x0: -wt - 1,
            z0: -wt - 1,
            x1: wt,
            z1: wt
        }));
        return i = i.filter(s => (s[2] = s[2].filter(a => {
            const c = a[0] - 8 >> 4
              , l = a[2] - 8 >> 4;
            return !o.find(u => Math.sqrt((c - u[0]) * (c - u[0]) + (l - u[1]) * (l - u[1])) < wt)
        }
        ),
        s[2].length > 0)),
        i
    }
    ;
    return n.free = () => {
        t.free?.()
    }
    ,
    n
}
;
class Yo {
    chunkGen;
    constructor(t) {
        this.chunkGen = new Fa(t)
    }
    buildHeightmap(t, n) {
        return this.chunkGen.buildHeightmap(t, n)
    }
    free() {
        this.chunkGen.free()
    }
}
const mc = {
    supportsWorld: e => N(g.EndCity, e),
    create: async (e, t) => {
        const n = t.end
          , r = new Yo(e)
          , i = J(e, {
            spacing: 20,
            separation: 11,
            salt: 10387313,
            linearSeparation: !1
        }, async (o, s) => hc(e, r, n, o, s), (o, s, a) => {
            if (e.edition === h.Java) {
                const c = le(e, o, s);
                c.nextInt(4);
                const l = Fi(c);
                return c.free(),
                {
                    hasShip: l
                }
            }
            return {
                hasShip: Fi(a)
            }
        }
        );
        return i.free = () => {
            r.free()
        }
        ,
        i
    }
};
function hc(e, t, n, r, i) {
    const o = n.getBiomeAtChunk(r, i);
    return [Tn, da].includes(o) ? pc(e, r, i, t) >= 60 : !1
}
const Ut = (e, t) => e * 16 + t;
function pc(e, t, n, r) {
    const i = r.buildHeightmap(t, n);
    let o;
    e.edition === h.Java ? e.javaVersion >= m.V1_19 ? o = le(e, t, n) : o = new ge(V.fromNumber(t).add(V.fromNumber(n).mul(10387313))) : o = new ee(10387313 * n + t);
    const s = o.nextInt(4);
    o.free();
    let a = 5
      , c = 5;
    s === 1 ? a = -5 : s === 2 ? (a = -5,
    c = -5) : s === 3 && (c = -5);
    const l = i[Ut(7, 7)]
      , u = i[Ut(7, 7 + c)]
      , d = i[Ut(7 + a, 7)]
      , f = i[Ut(7 + a, 7 + c)];
    return Math.min(l, u, d, f) + (e.edition === h.Bedrock ? 1 : 0)
}
function Fi(e) {
    const t = {
        hasShip: !1
    };
    return ct("TOWER_GENERATOR", 1, e, t),
    t.hasShip
}
const yc = {
    TOWER_GENERATOR: (e, t, n) => {
        t.nextInt(2),
        t.nextInt(2);
        let r = t.nextInt(3) === 0;
        const i = 1 + t.nextInt(3);
        for (let o = 0; o < i; o++)
            o >= i - 1 || !t.nextBoolean() || (r = !0);
        if (r)
            for (let o = 0; o < 4; o++)
                t.nextBoolean() && ct("TOWER_BRIDGE_GENERATOR", e + 1, t, n);
        else if (e !== 7)
            return ct("FAT_TOWER_GENERATOR", e + 1, t, n);
        return !0
    }
    ,
    TOWER_BRIDGE_GENERATOR: (e, t, n) => {
        const r = t.nextInt(4) + 1;
        for (let i = 0; i < r; i++)
            t.nextBoolean() || t.nextBoolean();
        if (n.hasShip || t.nextInt(10 - e) !== 0) {
            if (!ct("HOUSE_TOWER_GENERATOR", e + 1, t, n))
                return !1
        } else
            t.nextInt(8),
            t.nextInt(10),
            n.hasShip = !0;
        return !0
    }
    ,
    HOUSE_TOWER_GENERATOR: (e, t, n) => {
        if (e > 8)
            return !1;
        const r = t.nextInt(3);
        return (r === 1 || r === 2) && ct("TOWER_GENERATOR", e + 1, t, n),
        !0
    }
    ,
    FAT_TOWER_GENERATOR: (e, t, n) => {
        for (let r = 0; r < 2 && t.nextInt(3) !== 0; r++)
            for (let i = 0; i < 4; i++)
                t.nextBoolean() && ct("TOWER_BRIDGE_GENERATOR", e + 1, t, n);
        return !0
    }
};
function ct(e, t, n, r) {
    return t > 8 || r.hasShip ? !1 : yc[e](t, n, r) ? (n.nextInt(),
    !0) : !1
}
const bc = e => async t => Uo(t, (n, r) => {
    const i = n >> 4
      , o = r >> 4
      , s = V.fromNumber(i ^ o << 4).xor(e.seed)
      , a = e.edition === h.Bedrock ? new ee(s) : new ge(s);
    try {
        if (a.nextInt(),
        a.nextInt(3) !== 0)
            return !1;
        const c = (i << 4) + 4 + a.nextInt(8);
        if (n !== c)
            return !1;
        const l = (o << 4) + 4 + a.nextInt(8);
        return r === l
    } finally {
        a.free()
    }
}
)
  , wc = (e, t) => {
    const n = $o(e, t, g.NetherFortress);
    return J(e, {
        spacing: e.edition === h.Bedrock ? 30 : 27,
        separation: 4,
        salt: 30084232,
        linearSeparation: !0
    }, async (r, i, o) => e.edition === h.Java && e.javaVersion >= m.V1_18 ? !!n(r, i) : o.nextInt(e.edition === h.Bedrock ? 6 : 5) < 2)
}
  , vc = {
    supportsWorld: e => N(g.NetherFortress, e),
    create: async (e, t) => e.edition === h.Java && e.javaVersion < m.V1_16 || e.edition === h.Bedrock && e.bedrockVersion < x.V1_16 ? bc(e) : wc(e, t)
}
  , hr = 63
  , xc = -64
  , Pi = [$e, Oe, So, qe, To]
  , Zt = [mt, Qe, _t, Oe, Rt]
  , Kt = [$e, qe, Oe, Bt, Et, Vt, Rt, _t, mt, Qe, So, To]
  , es = {
    spacing: 32,
    separation: 5,
    salt: 10387313,
    linearSeparation: !1
}
  , Gr = {
    supportsWorld: e => N(g.OceanMonument, e),
    create: async (e, t) => J(e, es, async (n, r) => Sc(e, t.overworld, n, r))
};
function Sc(e, t, n, r) {
    if (e.edition === h.Java)
        if (e.javaVersion >= m.V1_18) {
            const i = t.noise();
            return Zt.includes(Ye(i, n, r, "oceanFloor")) && Ke(i, n * 16 + 9, hr, r * 16 + 9, 29, Kt)
        } else if (e.javaVersion >= m.V1_13) {
            const i = t.legacy();
            return i.areBiomesViable(n * 16 + 9, r * 16 + 9, 16, Zt) && i.areBiomesViable(n * 16 + 9, r * 16 + 9, 29, Kt)
        } else if (e.javaVersion >= m.V1_9) {
            const i = t.legacy();
            return i.areBiomesViable(n * 16 + 8, r * 16 + 8, 16, [Oe]) && i.areBiomesViable(n * 16 + 8, r * 16 + 8, 29, Pi)
        } else {
            const i = t.legacy();
            return i.getBiomeGenAt(n * 16 + 8, r * 16 + 8, 1, 1)[0] === Oe && i.areBiomesViable(n * 16 + 8, r * 16 + 8, 29, Pi)
        }
    else if (e.bedrockVersion >= x.V1_18) {
        const i = t.noise()
          , o = i.getPreliminarySurfaceLevel(n * 4, r * 4);
        return Ke(i, n * 16 + 8, o, r * 16 + 8, 16, Zt) && Ke(i, n * 16 + 8, o, r * 16 + 8, 29, Kt)
    } else {
        const i = t.legacy();
        return i.areBiomesViable(n * 16 + 8, r * 16 + 8, 16, Zt) && i.areBiomesViable(n * 16 + 8, r * 16 + 8, 29, Kt)
    }
}
const Cc = {
    supportsWorld: e => N(g.RuinedPortalOverworld, e),
    create: async e => J(e, {
        spacing: 40,
        separation: 15,
        salt: e.edition === h.Bedrock ? 40552231 : 34222645,
        linearSeparation: !0
    }, async () => !0)
}
  , Tc = {
    supportsWorld: e => N(g.RuinedPortalNether, e),
    create: async e => J(e, e.edition === h.Java && e.javaVersion >= m.V1_18 ? {
        spacing: 40,
        separation: 15,
        salt: 34222645,
        linearSeparation: !0
    } : {
        spacing: 25,
        separation: 10,
        salt: e.edition === h.Bedrock ? 40552231 : 34222645,
        linearSeparation: !0
    }, async () => !0)
}
  , Xt = e => e.edition === h.Java && e.javaVersion >= m.V1_13
  , Bc = e => e.edition === h.Java && e.javaVersion >= m.V1_16
  , on = e => e.edition === h.Java && e.javaVersion >= m.V1_18
  , ts = e => e.edition === h.Bedrock && e.bedrockVersion >= x.V1_18
  , Ec = {
    SHIPWRECK: e => e.edition === h.Bedrock ? {
        ...ts(e) ? {
            spacing: 24,
            separation: 4
        } : {
            spacing: 10,
            separation: 5,
            linearSeparation: !1
        },
        salt: 165745295,
        allowedBiomes: [ft, dt, bn, $e, Oe, Vt, mt, Et, _t, qe, Qe, Bt],
        checkChunk: (t, ...n) => Mc(e, ...n)
    } : {
        ...Bc(e) ? {
            spacing: 24,
            separation: 4
        } : {
            spacing: 16,
            separation: 8
        },
        salt: Xt(e) ? 165745295 : 14357617,
        checkBiome: on(e) ? (t, n, r, i, o) => {
            const s = [ft, dt]
              , a = o.filter(u => !s.includes(u))
              , c = Ye(n.noise(), r, i, "worldSurface");
            if (s.includes(c))
                return c;
            const l = Ye(n.noise(), r, i, "oceanFloor");
            return a.includes(l) ? l : !1
        }
        : void 0,
        allowedBiomes: [ft, dt, qe, $e, Vt, Et, Bt, Qe, mt, Oe, _t, Rt]
    },
    DESERT_TEMPLE: e => ({
        spacing: 32,
        separation: 8,
        salt: 14357617,
        allowedBiomes: [q, Eo],
        checkChunk: on(e) ? async (t, n, r, i, o, s) => Mi(n.noise(), o, s, 21, 21) >= hr : void 0
    }),
    JUNGLE_TEMPLE: e => ({
        spacing: 32,
        separation: 8,
        salt: Xt(e) ? 14357619 : 14357617,
        allowedBiomes: [pt, Ir, ...e.edition !== h.Bedrock ? [Vn, Lo] : []],
        checkChunk: on(e) ? async (t, n, r, i, o, s) => Mi(n.noise(), o, s, 12, 15) >= hr : void 0
    }),
    IGLOO: e => ({
        spacing: 32,
        separation: 8,
        salt: Xt(e) ? 14357618 : 14357617,
        allowedBiomes: [Be, Ae, On]
    }),
    WITCH_HUT: e => ({
        spacing: 32,
        separation: 8,
        salt: Xt(e) ? 14357620 : 14357617,
        allowedBiomes: e.edition === h.Java ? [Le] : [Le, Fo]
    })
}
  , ns = {
    supportsWorld: e => N(g.DesertTemple, e),
    create: (e, t, n) => Ht("DESERT_TEMPLE", e, t.overworld, n)
}
  , Vc = {
    supportsWorld: e => N(g.JungleTemple, e),
    create: (e, t, n) => Ht("JUNGLE_TEMPLE", e, t.overworld, n)
}
  , kc = {
    supportsWorld: e => N(g.WitchHut, e),
    create: (e, t, n) => Ht("WITCH_HUT", e, t.overworld, n)
}
  , Ic = {
    supportsWorld: e => N(g.Igloo, e),
    create: (e, t, n) => Ht("IGLOO", e, t.overworld, n, (r, i) => {
        if (e.edition === h.Bedrock) {
            const a = Ga(e, r, i);
            a.nextInt();
            const c = a.nextDouble() >= .5;
            return a.free(),
            {
                hasBasement: c
            }
        }
        if (e.javaVersion < m.V1_13)
            return {
                hasBasement: null
            };
        const o = le(e, r, i);
        o.nextInt(4);
        const s = o.nextDouble() < .5;
        return o.free(),
        {
            hasBasement: s
        }
    }
    )
}
  , Oc = {
    supportsWorld: e => N(g.Shipwreck, e),
    create: (e, t, n) => Ht("SHIPWRECK", e, t.overworld, n)
};
async function Mc(e, t, n, r, i, o) {
    const a = [dt, ft, bn].includes(r) ? 10 : 20;
    return (e.bedrockVersion >= x.V1_18 ? Ke(t.noise(), i * 16 + 8, t.noise().getPreliminarySurfaceLevel(i * 4, o * 4), o * 16 + 8, a, [r]) : t.legacy().areBiomesViable((i << 4) + 8, (o << 4) + 8, a, [r])) ? (await (await Gr.create(e, {
        overworld: t
    }, n))({
        x: i - 5,
        z: o - 5,
        sizeX: 10,
        sizeZ: 10
    })).length < 1 : !1
}
function Ac(e, t, n, r, i) {
    const o = on(e) ? Ye(t.noise(), n, r, "worldSurface") : ts(e) ? Pn(t.noise(), n * 16 + 8, t.noise().getPreliminarySurfaceLevel(n * 4, r * 4), r * 16 + 8) : t.legacy().getBiomeForStructure(n, r);
    return i.includes(o) ? o : !1
}
async function Ht(e, t, n, r, i) {
    const {allowedBiomes: o, checkBiome: s, checkChunk: a, ...c} = Ec[e](t)
      , l = {
        linearSeparation: !0,
        ...c
    }
      , u = s || Ac
      , d = async (f, _) => {
        const p = u(t, n, f, _, o);
        return p ? !a || await a(t, n, r, p, f, _) : !1
    }
    ;
    return i ? J(t, l, d, i) : J(t, l, d)
}
const Fc = {
    supportsWorld: e => N(g.SlimeChunk, e),
    create: qo(Pc)
};
function Pc(e, t, n) {
    return e.edition === h.Bedrock ? Wc(t, n) : Dc(e.seed, t, n)
}
const Rc = 4987142
  , zc = 5947611
  , Lc = V.fromInt(4392871)
  , Nc = 389711
  , Hc = V.fromInt(987234911);
function Dc(e, t, n) {
    const r = e.add(V.fromInt(Math.imul(Math.imul(t, t), Rc))).add(V.fromInt(Math.imul(t, zc))).add(V.fromInt(Math.imul(n, n)).multiply(Lc)).add(V.fromInt(Math.imul(n, Nc))).xor(Hc)
      , i = new ge(r)
      , o = i.nextInt(10) === 0;
    return i.free(),
    o
}
function Wc(e, t) {
    const n = new ee(Math.imul(e, 522133279) ^ t)
      , r = n.nextInt(10) === 0;
    return n.free(),
    r
}
const Jr = {
    supportsWorld: e => N(g.Village, e),
    create: jc
};
function rs(e) {
    return {
        spacing: e.javaVersion >= m.V1_18 ? 34 : 32,
        separation: 8,
        salt: 10387312,
        linearSeparation: !0
    }
}
async function jc(e, t) {
    if (e.edition === h.Java) {
        const r = rs(e);
        return e.javaVersion >= m.V1_18 ? J(e, r, async (i, o) => Uc(e, t.overworld, i, o), (i, o, s, a) => a) : J(e, r, async (i, o) => Jc(e, t.overworld, i, o), (i, o, s, a) => {
            if (a === !0)
                return {
                    type: null,
                    zombie: null
                };
            if (e.javaVersion < m.V1_15)
                return {
                    type: null,
                    zombie: null
                };
            const c = zi(a)
              , l = le(e, i, o);
            l.nextIntVoid(4);
            const u = Xo(os[c], l);
            return l.free(),
            {
                type: c,
                zombie: ss(u[0])
            }
        }
        )
    }
    const n = t.overworld;
    return J(e, {
        spacing: e.bedrockVersion >= x.V1_18 ? 34 : 27,
        separation: e.bedrockVersion >= x.V1_18 ? 8 : 10,
        salt: 10387312,
        linearSeparation: !1
    }, async (r, i) => e.bedrockVersion >= x.V1_18 ? Wr(n.noise(), r * 16 + 8, n.noise().getPreliminarySurfaceLevel(r * 4, i * 4), i * 16 + 8, 2, Ri) : n.legacy().areBiomesViable(r * 16 + 8, i * 16 + 8, 2, Ri), (r, i, o, s) => {
        const a = typeof s != "boolean" ? s : e.bedrockVersion >= x.V1_18 ? Pn(n.noise(), r * 16 + 8, n.noise().getPreliminarySurfaceLevel(r * 4, i * 4), i * 16 + 8) : n.legacy().getBiomeForStructure(r, i);
        o.nextInt(4);
        const c = e.bedrockVersion >= x.V1_18 ? .02 : .2;
        return {
            type: zi(a),
            zombie: o.nextDouble() < c
        }
    }
    )
}
const Gn = [xe, q, Se]
  , $t = [xe, q, Se, _e]
  , qt = [xe, q, Se, _e, Be]
  , me = [q, xe, rt, Se, Be, _e]
  , is = {
    [m.V1_7]: Gn,
    [m.V1_8]: Gn,
    [m.V1_9]: Gn,
    [m.V1_10]: $t,
    [m.V1_11]: $t,
    [m.V1_12]: $t,
    [m.V1_13]: $t,
    [m.V1_14]: qt,
    [m.V1_15]: qt,
    [m.V1_16]: qt,
    [m.V1_17]: qt,
    [m.V1_18]: me,
    [m.V1_19]: me,
    [m.V1_19_3]: me,
    [m.V1_20]: me,
    [m.V1_21]: me,
    [m.V1_21_2]: me,
    [m.V1_21_4]: me,
    [m.V1_21_5]: me,
    [m.V1_21_6]: me,
    [m.V1_21_9]: me,
    [m.V26_2]: me,
    [m.V26_3]: me
}
  , Ri = [xe, zt, Se, Be, _e, Ft, Ae, Sn, q, rt]
  , Ur = {
    desert: [q],
    plains: [xe, zt, rt],
    savanna: [Se],
    snowy: [Be],
    taiga: [_e, Ft, Ae, Sn]
}
  , Gc = Object.keys(Ur)
  , zi = e => {
    for (const t of Gc)
        if (Ur[t].includes(e))
            return t;
    throw new Error(`Unexpected biome for village: ${e.id}`)
}
;
function Jc(e, t, n, r) {
    const i = is[e.javaVersion]
      , o = t.legacy();
    if (e.javaVersion < m.V1_13)
        return o.areBiomesViable(n * 16 + 8, r * 16 + 8, 0, i);
    const s = o.getBiomeForStructure(n, r);
    return i.includes(s) ? s : !1
}
const os = {
    desert: [["desert_meeting_point_1", 98, [17, 6, 9]], ["desert_meeting_point_2", 98, [12, 6, 12]], ["desert_meeting_point_3", 49, [15, 6, 15]], ["zombie/desert_meeting_point_1", 2, [17, 6, 9]], ["zombie/desert_meeting_point_2", 2, [12, 6, 12]], ["zombie/desert_meeting_point_3", 1, [15, 6, 15]]],
    plains: [["plains_fountain_01", 50, [9, 4, 9]], ["plains_meeting_point_1", 50, [10, 7, 10]], ["plains_meeting_point_2", 50, [8, 5, 15]], ["plains_meeting_point_3", 50, [11, 9, 11]], ["zombie/plains_fountain_01", 1, [9, 6, 9]], ["zombie/plains_meeting_point_1", 1, [10, 7, 10]], ["zombie/plains_meeting_point_2", 1, [8, 5, 15]], ["zombie/plains_meeting_point_3", 1, [11, 9, 11]]],
    savanna: [["savanna_meeting_point_1", 100, [14, 5, 12]], ["savanna_meeting_point_2", 50, [11, 6, 11]], ["savanna_meeting_point_3", 150, [9, 6, 11]], ["savanna_meeting_point_4", 150, [9, 6, 9]], ["zombie/savanna_meeting_point_1", 2, [14, 6, 12]], ["zombie/savanna_meeting_point_2", 1, [11, 6, 11]], ["zombie/savanna_meeting_point_3", 3, [9, 6, 11]], ["zombie/savanna_meeting_point_4", 3, [9, 6, 9]]],
    snowy: [["snowy_meeting_point_1", 100, [12, 8, 8]], ["snowy_meeting_point_2", 50, [11, 5, 9]], ["snowy_meeting_point_3", 150, [7, 7, 7]], ["zombie/snowy_meeting_point_1", 2, [12, 8, 8]], ["zombie/snowy_meeting_point_2", 1, [11, 6, 9]], ["zombie/snowy_meeting_point_3", 3, [7, 7, 7]]],
    taiga: [["taiga_meeting_point_1", 49, [22, 3, 18]], ["taiga_meeting_point_2", 49, [9, 7, 9]], ["zombie/taiga_meeting_point_1", 1, [22, 6, 18]], ["zombie/taiga_meeting_point_2", 1, [9, 7, 9]]]
}
  , ss = e => e.startsWith("zombie/");
function Uc(e, t, n, r) {
    const i = is[e.javaVersion]
      , o = t.noise()
      , s = ["plains", "desert", "savanna", "snowy", "taiga"];
    for (const a of s) {
        const c = Ur[a].filter(u => i.includes(u));
        if (c.length < 1)
            continue;
        const l = it({
            world: e,
            biomeProvider: o,
            chunkX: n,
            chunkZ: r,
            initialY: 0,
            projectionY: {
                heightType: "worldSurface",
                surfaceCheckType: "topmostAccurate"
            },
            allowedBiomes: c,
            structures: os[a]
        });
        if (l)
            return {
                type: a,
                zombie: ss(l.key)
            }
    }
    return !1
}
const Zc = {
    supportsWorld: e => N(g.Stronghold, e),
    finiteGenerationArea: e => e.edition === h.Java ? {
        x: -1536,
        z: -1536,
        sizeX: 3072,
        sizeZ: 3072
    } : null,
    create: async (e, t, n) => {
        const r = await n.sharedTask("StrongholdFinder.staticStrongholds", () => Kc(e, t.overworld, n));
        return async i => [...r.filter( ([o,s]) => Ne(i, {
            x: o,
            z: s
        })), ...Xc(e, i)]
    }
};
async function Kc(e, t, n) {
    return e.edition === h.Bedrock ? await Yc(e, t, n) : e.javaVersion >= m.V1_9 ? $c(e, t) : Qc(e, t.legacy())
}
function Xc(e, t) {
    return e.edition === h.Bedrock ? qc(e, t) : []
}
const sn = 32
  , as = 3
  , Ue = [xe, q, kr, At, _e, Be, ua, Bo, Eo, wn, Ft, fa, pt, Ir, vn, Vo, xn, ko, nt, Ae, Sn, Pt, Io, Oo, Se, Or, Mr, Cn, Mo, zt, ga, Ao, Ar, _a, Po, ma, ha, Bn, pa, Lt, ya, En, ba, wa, Ro, va, zo, xa, Sa]
  , an = [...Ue, bn]
  , Li = [...an, Vn, Lo]
  , he = [xe, q, kr, At, _e, Be, Bo, wn, pt, vn, xn, nt, Ae, Pt, Se, Or, Mr, Cn, zt, Ao, Ar, Po, Bn, En, Ro, zo, Vn, kn, In, rt, Fr, On, Pr, Rr, zr, Mn, An]
  , pr = {
    [m.V1_7]: Ue,
    [m.V1_8]: Ue,
    [m.V1_9]: Ue,
    [m.V1_10]: Ue,
    [m.V1_11]: Ue,
    [m.V1_12]: Ue,
    [m.V1_13]: an,
    [m.V1_14]: Li,
    [m.V1_15]: Li,
    [m.V1_16]: an,
    [m.V1_17]: an,
    [m.V1_18]: he,
    [m.V1_19]: he,
    [m.V1_19_3]: he,
    [m.V1_20]: he,
    [m.V1_21]: he,
    [m.V1_21_2]: he,
    [m.V1_21_4]: he,
    [m.V1_21_5]: he,
    [m.V1_21_6]: he,
    [m.V1_21_9]: he,
    [m.V26_2]: he,
    [m.V26_3]: he
};
function $c(e, t) {
    const r = new ge(e.seed);
    let i = r.nextDouble() * 3.141592653589793 * 2;
    const o = [];
    let s = 0
      , a = 0
      , c = as;
    for (let l = 0; l < 128; ++l) {
        const u = r.nextDouble()
          , d = 4 * sn + sn * s * 6 + (u - .5) * sn * 2.5;
        let f = Math.round(Math.cos(i) * d)
          , _ = Math.round(Math.sin(i) * d);
        const p = e.javaVersion >= m.V1_19_3 ? new ge(r.nextLong()) : null
          , w = e.javaVersion >= m.V1_18 ? za(t.noise(), (f << 4) + 8, 0, (_ << 4) + 8, 112, v => pr[e.javaVersion].includes(v), e.javaVersion >= m.V1_19_3 ? p : r) : t.legacy().findBiomePosition((f << 4) + 8, (_ << 4) + 8, 112, pr[e.javaVersion], r);
        p?.free(),
        w != null && (f = w[0] >> 4,
        _ = w[2] >> 4),
        o.push([f, _]),
        i += 6.283185307179586 / c,
        a += 1,
        a === c && (s++,
        a = 0,
        c += gn(2 * c / (s + 1)),
        c = Math.min(c, 128 - l),
        i += r.nextDouble() * 3.141592653589793 * 2)
    }
    return r.free(),
    o
}
function qc(e, t) {
    const o = Dr(t, 200);
    return Ka(o, (s, a) => {
        const c = s * 200 + Math.floor(100)
          , l = a * 200 + Math.floor(200 / 2)
          , u = (Math.imul(-1683231919, c) - Math.imul(1100435783, l) + e.seed.toInt() | 0) + 97858791 | 0
          , d = new ee(u)
          , f = 200 * s + 200 - 150
          , _ = 200 * a + 200 - 150
          , p = 200 * s + 150
          , w = 200 * a + 150
          , v = d.nextIntRange(f, p)
          , T = d.nextIntRange(_, w)
          , B = d.nextFloat() < .25;
        return d.free(),
        B ? [[v, T]] : []
    }
    ).filter( ([s,a]) => Ne(t, {
        x: s,
        z: a
    }))
}
function Qc(e, t) {
    const r = new ge(e.seed);
    let i = r.nextDouble() * 3.141592653589793 * 2
      , o = 1;
    const s = [];
    let a = as;
    for (let c = 0; c < 3; ++c) {
        const l = r.nextDouble()
          , u = (1.25 * o + l) * sn * o;
        let d = Math.round(Math.cos(i) * u)
          , f = Math.round(Math.sin(i) * u);
        const _ = t.findBiomePosition((d << 4) + 8, (f << 4) + 8, 112, pr[e.javaVersion], r);
        _ != null && (d = _[0] >> 4,
        f = _[2] >> 4),
        s.push([d, f]),
        i += 3.141592653589793 * 2 * o / a,
        c === a && (o += 2 + r.nextInt(5),
        a += 1 + r.nextInt(2))
    }
    return r.free(),
    s
}
async function Yc(e, t, n) {
    const i = []
      , o = await Jr.create(e, {
        overworld: t
    }, n)
      , s = new ee(e.seed);
    let a = s.nextFloat() * Math.PI * 2
      , c = s.nextInt(16) + 40;
    s.free();
    let l = 0;
    for (; l < 3; ) {
        const u = Math.floor(c * Math.cos(a))
          , d = Math.floor(c * Math.sin(a));
        let f = !1;
        e: for (let _ = u - 8; _ < u + 8; _++)
            for (let p = d - 8; p < d + 8; p++)
                if ((await o({
                    x: _,
                    z: p,
                    sizeX: 1,
                    sizeZ: 1
                })).length > 0) {
                    i[l++] = [_, p],
                    f = !0;
                    break e
                }
        f ? (a += .6 * Math.PI,
        c += 8) : (a += .25 * Math.PI,
        c += 4)
    }
    return i
}
const el = [nt, Lt]
  , tl = [nt, Lt, Mn]
  , nl = [nt, Lt, In, kn]
  , rl = [nt, Lt, In, kn, Mn, An]
  , il = e => e.edition === h.Java ? e.javaVersion >= m.V1_21_5 ? tl : el : e.bedrockVersion >= x.V1_21_60 ? rl : nl
  , ol = {
    supportsWorld: e => N(g.WoodlandMansion, e),
    create: async (e, t) => J(e, {
        spacing: 80,
        separation: 20,
        linearSeparation: !1,
        salt: 10387319
    }, async (n, r) => sl(e, t.overworld, n, r))
};
function sl(e, t, n, r) {
    const i = il(e);
    if (e.edition === h.Java && e.javaVersion >= m.V1_18) {
        const s = t.noise().getNoiseBiomeAtHeightType(n * 16 + 7 >> 2, r * 16 + 7 >> 2, "worldSurface");
        return i.includes(Me(s))
    } else if (e.edition === h.Bedrock && e.bedrockVersion >= x.V1_18)
        return Ke(t.noise(), n * 16 + 8, t.noise().getPreliminarySurfaceLevel(n * 4, r * 4), r * 16 + 8, 32, i);
    const o = e.edition !== h.Bedrock && e.javaVersion >= m.V1_13 ? 9 : 8;
    return t.legacy().areBiomesViable(n * 16 + o, r * 16 + o, 32, i)
}
const Ni = [xe, q, _e, Be, Se, Fr, rt, Pr, Rr, zr, On, Lr]
  , cs = [xe, zt, Se, Be, _e, Ft, Sn, q]
  , al = [...cs, Ae, rt, Pr, Rr, zr, On, Fr, Lr]
  , cl = {
    supportsWorld: e => N(g.PillagerOutpost, e),
    create: async (e, t, n) => {
        if (e.edition === h.Bedrock)
            return J(e, {
                spacing: 80,
                separation: 24,
                salt: 165745296,
                linearSeparation: !1
            }, async (i, o) => ll(e, t.overworld, i, o));
        const r = await Jr.create(e, t, n);
        return J(e, {
            spacing: 32,
            separation: 8,
            salt: 165745296,
            linearSeparation: !0
        }, async (i, o) => await ul(e, t.overworld, r, i, o))
    }
};
function ll(e, t, n, r) {
    return e.bedrockVersion >= x.V1_18 ? Ke(t.noise(), n * 16 + 8, t.noise().getPreliminarySurfaceLevel(n * 4, r * 4), r * 16 + 8, 0, al) : t.legacy().areBiomesViable(n * 16 + 8, r * 16 + 8, 0, cs)
}
async function ul(e, t, n, r, i) {
    const o = r >> 4
      , s = i >> 4
      , a = V.fromNumber(o ^ s << 4).xor(e.seed)
      , c = new ge(a);
    c.nextIntVoid();
    const l = c.nextInt(5);
    if (c.free(),
    l !== 0 || !fl(e, t, r, i))
        return !1;
    const u = {
        x: r - 10,
        z: i - 10,
        sizeX: 21,
        sizeZ: 21
    };
    return e.javaVersion >= m.V1_16 ? !await Qa(e, rs(e), u) : (await n(u)).length <= 0
}
function fl(e, t, n, r) {
    return e.javaVersion >= m.V1_18 ? !!it({
        world: e,
        biomeProvider: t.noise(),
        chunkX: n,
        chunkZ: r,
        initialY: 0,
        projectionY: {
            heightType: "worldSurface",
            surfaceCheckType: "topmostAccurate"
        },
        allowedBiomes: Ni,
        structures: [["outpost", 1, [16, 30, 16]]]
    }) : Ni.includes(t.getBiomeForStructure(n, r))
}
const Ge = {
    warm: [_t, Rt, Et, Bt],
    cold: [Vt, mt, Qe, Oe, qe, $e]
}
  , dl = new Map([[qe, {
    type: "cold",
    largeProbability: .3,
    clusterProbability: .25
}], [$e, {
    type: "cold",
    largeProbability: .3,
    clusterProbability: .25
}], [Oe, {
    type: "cold",
    largeProbability: .5,
    clusterProbability: .4
}], [Bt, {
    type: "warm",
    largeProbability: .3,
    clusterProbability: .5
}], [Rt, {
    type: "warm",
    largeProbability: .3,
    clusterProbability: .5
}], [Et, {
    type: "warm",
    largeProbability: .3,
    clusterProbability: .5
}], [_t, {
    type: "warm",
    largeProbability: .3,
    clusterProbability: .5
}], [Vt, {
    type: "cold",
    largeProbability: .3,
    clusterProbability: .25
}], [mt, {
    type: "cold",
    largeProbability: .5,
    clusterProbability: .4
}], [Qe, {
    type: "cold",
    largeProbability: .5,
    clusterProbability: .4
}]])
  , gl = {
    supportsWorld: e => N(g.OceanRuin, e),
    async create(e, t, n) {
        const r = e.edition === h.Bedrock ? await Gr.create(e, t, n) : null;
        return J(e, e.edition === h.Java || e.bedrockVersion >= x.V1_18 ? {
            spacing: 20,
            separation: 8,
            linearSeparation: !0,
            salt: 14357621
        } : {
            spacing: 12,
            separation: 7,
            linearSeparation: !1,
            salt: 14357621
        }, async (i, o) => {
            if (e.edition === h.Bedrock) {
                if ((await r({
                    x: i - 5,
                    z: o - 5,
                    sizeX: 10,
                    sizeZ: 10
                })).length >= 1)
                    return !1;
                const a = [...Ge.cold, ...Ge.warm];
                let c;
                if (e.bedrockVersion >= x.V1_18) {
                    const l = t.overworld.noise()
                      , u = l.getPreliminarySurfaceLevel(i * 4, o * 4);
                    if (c = Wr(l, i * 16 + 8, u, o * 16 + 8, 0, a),
                    !c)
                        return !1
                } else {
                    if (!t.overworld.legacy().areBiomesViable(i * 16 + 8, o * 16 + 8, 0, a))
                        return !1;
                    c = t.overworld.legacy().getBiomeForStructure(i, o)
                }
                return [...Ge.cold, ...Ge.warm].includes(c) ? c : !1
            } else {
                const s = e.javaVersion >= m.V1_18 ? Ye(t.overworld.noise(), i, o, "oceanFloor") : t.overworld.legacy().getBiomeForStructure(i, o);
                return [...Ge.cold, ...Ge.warm].includes(s) ? s : !1
            }
        }
        , (i, o, s, a) => {
            const c = e.edition === h.Bedrock ? dl.get(a) : {
                type: Ge.cold.includes(a) ? "cold" : "warm",
                largeProbability: .3,
                clusterProbability: .9
            };
            if (!c)
                throw new Error("Unexpected biome");
            const l = e.edition === h.Bedrock ? qa(e, i + 4, o + 4, es).rng : le(e, i, o);
            l.nextInt(4);
            const u = l.nextFloat() <= c.largeProbability;
            let d = 0;
            if (u && (l.nextInt(),
            l.nextFloat() <= c.clusterProbability)) {
                for (let f = 0; f < 16; f++)
                    l.nextInt();
                d = 4 + l.nextInt(5)
            }
            return l.free(),
            {
                type: c.type,
                isLarge: u,
                clusterSize: d
            }
        }
        )
    }
}
  , ls = [pt, Ir, xe, At, wn, _e, Ft];
function _l(e, t) {
    if (e.bedrockVersion >= x.V1_18) {
        const [r,,i] = t.noise().findSpawnPosition();
        return [r, i]
    }
    let n = 40;
    for (; n < 2e4; ) {
        const r = t.legacy().getBiomeArea(n, 0, n + 40, 40);
        for (let i = 1; i < 9; i++)
            for (let o = 1; o < 9; o++)
                if ([[n + o * 4 + 0, i * 4 + 0], [n + o * 4 - 4, i * 4 + 0], [n + o * 4 + 4, i * 4 + 0], [n + o * 4 + 0, i * 4 - 4], [n + o * 4 + 0, i * 4 + 4]].every(c => ls.includes(r(c[0], c[1]))))
                    return [n + 4 * o, 4 * i];
        n += 40
    }
    return [0, 0]
}
function ml(e, t) {
    if (e.javaVersion >= m.V1_18) {
        const [n,,r] = t.noise().findSpawnPosition();
        return [n, r]
    } else {
        const n = new ge(e.seed)
          , [r,,i] = t.legacy().findBiomePosition(0, 0, 256, ls, n) || [0, 0, 0];
        return n.free(),
        [r, i]
    }
}
const hl = {
    supportsWorld: e => N(g.Spawn, e),
    finiteGenerationArea(e) {
        return e.edition === h.Bedrock && e.bedrockVersion < x.V1_18 ? {
            x: 0,
            z: 0,
            sizeX: 1253,
            sizeZ: 3
        } : {
            x: -512,
            z: -512,
            sizeX: 1024,
            sizeZ: 1024
        }
    },
    async create(e, {overworld: t}) {
        const n = e.edition === h.Java ? ml(e, t) : _l(e, t)
          , r = {
            x: n[0] >> 4,
            z: n[1] >> 4
        };
        return async i => Ne(i, r) ? [[r.x, r.z, {
            x: n[0],
            z: n[1]
        }]] : []
    }
};
function us(e, t, n, r) {
    const i = t.add(n);
    return rn(i, V.fromNumber(1e4 * r)),
    e.javaVersion >= m.V1_18 ? It.fromSeed(i) : new ge(i)
}
function pl(e) {
    const t = e;
    return t.decorator ? t.decorator : t.placement.reverse()
}
function He(e, t, n, r) {
    const {decorationStepOrdinal: i, featureIndex: o, feature: s} = r
      , a = pl(r)
      , c = [t * 16, 0, n * 16]
      , l = Do(e, c[0], c[2])
      , u = us(e, l, o, i)
      , d = []
      , f = {
        random: u
    };
    return a.reduce( (p, w) => (v, T, B) => {
        w(v, T, k => p(k, T, B))
    }
    , p => d.push(s(p, f)))(c, f, p => {
        const w = s(p, f);
        d.push(w)
    }
    ),
    u.free(),
    d
}
const De = e => (t, n, r) => {
    n.random.nextFloat() < 1 / e.chance && r(t)
}
  , Dt = () => e => [e]
  , Hi = e => t => {
    const {minInclusive: n, maxInclusive: r} = e;
    return n > r ? r : t.nextInt(r - n + 1) + n
}
  , yl = e => t => {
    const {minInclusive: n, maxInclusive: r, plateau: i=0} = e;
    if (n > r)
        return console.warn("3276386391"),
        r;
    const o = r - n;
    if (i >= o)
        return Jn(t, n, r);
    const s = Math.floor((o - i) / 2)
      , a = o - s;
    return n + Jn(t, 0, a) + Jn(t, 0, s)
}
;
function Jn(e, t, n) {
    return e.nextInt(n - t + 1) + t
}
const bl = e => (t, n, r) => {
    const i = e(n.random);
    r([t[0], i, t[2]])
}
  , Un = e => t => bl(e(t))
  , _n = {
    uniform: Un(Hi),
    triangle: Un(yl),
    range_8_8_nether: Un( () => Hi({
        minInclusive: 8,
        maxInclusive: 119
    }))
}
  , Ot = ({provider: e, allowedBiomes: t, disallowedBiomes: n}) => (r, i, o) => {
    const s = Me(e.getNoiseBiome(r[0] >> 2, r[1] >> 2, r[2] >> 2));
    t && !t.includes(s) || n && n.includes(s) || o(r)
}
  , et = () => (e, t, n) => {
    const {random: r} = t
      , i = e[0] + r.nextInt(16)
      , o = e[2] + r.nextInt(16);
    n([i, e[1], o])
}
  , Di = e => (t, n) => {
    const {random: r} = n;
    r.nextInt(4),
    r.nextInt(4);
    const i = Math.min(t[1], e.getSurfaceBlock(t[0], t[2], "oceanFloor", "topmostAccurate"))
      , o = Math.max(i - 15 - r.nextInt(10), xc + 10);
    return [[t[0], o, t[2]]]
}
;
class mn {
    gen;
    constructor(t, n) {
        const r = be(t);
        this.gen = new Qn(r,n)
    }
    getSeedForChunk(t, n) {
        return this.gen.get_seed_for_chunk(t, n)
    }
    free() {
        this.gen.free()
    }
}
const wl = {
    supportsWorld: e => N(g.Fossil, e),
    create: async function(e, t) {
        return e.edition === h.Java ? e.javaVersion >= m.V1_18 ? vl(e, t.overworld.noise()) : Sl(e, t.overworld.legacy()) : Cl(e, t.overworld)
    }
}
  , Wi = [q, Le, No];
function vl(e, t) {
    return async n => {
        const r = [];
        return ie(n, (i, o) => {
            const s = He(e, i, o, {
                decorationStepOrdinal: 3,
                featureIndex: 0,
                placement: [De({
                    chance: 64
                }), et(), _n.uniform({
                    minInclusive: 0,
                    maxInclusive: 319
                }), Ot({
                    provider: t,
                    allowedBiomes: Wi
                })],
                feature: Di(t)
            })
              , a = He(e, i, o, {
                decorationStepOrdinal: 3,
                featureIndex: 1,
                placement: [De({
                    chance: 64
                }), et(), _n.uniform({
                    minInclusive: -64,
                    maxInclusive: -8
                }), Ot({
                    provider: t,
                    allowedBiomes: Wi
                })],
                feature: Di(t)
            })
              , c = [];
            s.length > 0 && c.push([...s[0][0], "coal"]),
            a.length > 0 && c.push([...a[0][0], "diamond"]),
            c.length > 0 && r.push([i, o, c])
        }
        ),
        r
    }
}
const xl = {
    [q.id]: 0,
    [Le.id]: 0,
    [Fo.id]: 1
};
function Sl(e, t) {
    return async n => {
        const r = []
          , i = t.getNoiseBiomeArea(n.x * 4 + 2, n.z * 4 + 2, (n.x + n.sizeX) * 4 - 2, (n.z + n.sizeZ) * 4 - 2);
        return ie(n, (o, s) => {
            const a = i(o * 4 + 2, s * 4 + 2).id
              , c = xl[a];
            if (c == null)
                return;
            He(e, o, s, {
                decorationStepOrdinal: 3,
                featureIndex: c + 2,
                decorator: [De({
                    chance: 64
                })],
                feature: Dt()
            }).length > 0 && r.push([o, s, void 0])
        }
        ),
        r
    }
}
function ji(e, t, n) {
    return n === "default" ? t === q.id || t === Le.id : n === "deep" && e >= x.V1_18 && (t === q.id || t === Le.id || t === No.id && e >= x.V1_21_60)
}
function Cl(e, t) {
    const n = e.bedrockVersion >= x.V1_18
      , r = new mn(e,"minecraft:desert_or_swamp_after_surface_fossil_feature")
      , i = n ? new mn(e,"minecraft:desert_or_swamp_after_surface_fossil_deepslate_feature") : null
      , o = async s => {
        const a = []
          , c = n ? null : t.legacy().getBiomeArea(s.x * 16, s.z * 16, (s.x + s.sizeX) * 16, (s.z + s.sizeZ) * 16);
        return ie(s, (l, u) => {
            const d = c ? c(l * 16 + 15, u * 16 + 15) : Pn(t.noise(), l * 16, 0, u * 16)
              , f = ji(e.bedrockVersion, d.id, "default")
              , _ = ji(e.bedrockVersion, d.id, "deep");
            if (!f && !_)
                return;
            const p = [];
            if (f) {
                const w = r.getSeedForChunk(l, u)
                  , v = new ee(w);
                v.nextInt(64) < 1 && p.push([null, null, null, "coal"]),
                v.free()
            }
            if (_ && i) {
                const w = i.getSeedForChunk(l, u)
                  , v = new ee(w);
                v.nextInt(64) < 1 && p.push([null, null, null, "diamond"]),
                v.free()
            }
            p.length > 0 && a.push([l, u, p])
        }
        ),
        a
    }
    ;
    return o.free = () => {
        r.free(),
        i?.free()
    }
    ,
    o
}
const Tl = {
    supportsWorld: e => N(g.FossilNether, e),
    create: async function(e, t) {
        return Bl(e, t.nether.noise())
    }
};
function Bl(e, t) {
    const n = new cr(be(e))
      , r = async i => {
        const o = n.find(i.x, i.z, i.sizeX, i.sizeZ, t.provider).map(s => [s.x, s.y, s.z, {
            variant: s.variant,
            hasDriedGhast: s.hasDriedGhast
        }]);
        return Fe(o, s => [s[0] >> 4, s[2] >> 4])
    }
    ;
    return r.free = () => {
        n.free()
    }
    ,
    r
}
const Rn = (e, t, n) => e.nextInt(n - t + 1) + t
  , yr = (e, t, n) => Rn(e, t, n - 1)
  , El = (e, t, n, r) => {
    const i = n - t
      , o = (i - r) / 2
      , s = i - o;
    return t + e.nextFloat() * s + e.nextFloat() * o
}
  , Vl = {
    supportsWorld: e => N(g.Ravine, e),
    create: async (e, {overworld: t}) => e.edition === h.Java ? e.javaVersion >= m.V1_18 ? kl(e) : Ol(e, t.legacy()) : Ml(e, t)
};
function kl(e) {
    return async t => {
        const n = [];
        return ie(t, (r, i) => {
            const o = []
              , s = le(e, r, i, 2);
            if (s.nextFloat() < .01) {
                const a = Il(s, r, i);
                o.push(a)
            }
            s.free(),
            o.length > 0 && n.push([r, i, o])
        }
        ),
        n
    }
}
function Il(e, t, n) {
    const r = t * 16 + e.nextInt(16)
      , i = Rn(e, 10, 67)
      , o = n * 16 + e.nextInt(16);
    e.nextFloat(),
    e.nextFloat();
    const s = El(e, 0, 6, 2);
    return {
        x: r,
        y: i,
        z: o,
        thickness: s,
        isUnderwater: !1,
        isMegaRavine: !1
    }
}
function Ol(e, t) {
    return async n => {
        const r = []
          , i = t.getNoiseBiomeArea((n.x - 8) * 4, (n.z - 8) * 4, (n.x + n.sizeX + 8) * 4, (n.z + n.sizeZ + 8) * 4);
        return ie(n, (o, s) => {
            const a = []
              , c = le(e, o, s, 1);
            if (c.nextFloat() < .02) {
                const u = Gi(c, o, s, !1);
                a.push(u)
            }
            c.free();
            const l = le(e, o, s, 0);
            l.nextFloat() < .02 && i(o * 4, s * 4).category === "ocean" && a.push(Gi(l, o, s, !0)),
            l.free(),
            a.length > 0 && r.push([o, s, a])
        }
        ),
        r
    }
}
function Gi(e, t, n, r) {
    const i = t * 16 + e.nextInt(16)
      , o = e.nextInt(e.nextInt(40) + 8) + 20
      , s = n * 16 + e.nextInt(16);
    e.nextFloat(),
    e.nextFloat();
    const a = (e.nextFloat() * 2 + e.nextFloat()) * 2;
    return {
        x: i,
        y: o,
        z: s,
        thickness: a,
        isUnderwater: r,
        isMegaRavine: !1
    }
}
function Ml(e, t) {
    const n = Fn(e);
    return async r => {
        const i = [];
        return ie(r, (o, s) => {
            const a = new ee(n(o, s));
            try {
                if (a.nextInt(e.bedrockVersion >= x.V1_21_60 ? 100 : 150) !== 0)
                    return;
                const c = a.nextInt(16) + o * 16;
                let l;
                if (e.bedrockVersion >= x.V1_21_60)
                    l = Rn(a, 10, 67),
                    a.nextInt();
                else {
                    const w = a.nextInt(40);
                    l = a.nextInt(w + 8) + 20
                }
                a.nextInt();
                const u = a.nextInt(16) + s * 16;
                a.nextFloat(),
                a.nextFloat();
                let d = 3 * a.nextFloat() + 3 * a.nextFloat();
                const f = a.nextFloat() < .05;
                f && (d = 2 * d);
                const p = (e.bedrockVersion < x.V1_18 ? t.legacy().getBiomeGenAt(c, u, 1, 1)[0] : Ye(t.noise(), o, s, "oceanFloor")).category === "ocean";
                (!p || e.bedrockVersion < x.V1_18 || e.bedrockVersion >= x.V1_21_60) && i.push([o, s, [{
                    x: c,
                    y: l,
                    z: u,
                    thickness: d,
                    isMegaRavine: f,
                    isUnderwater: p
                }]])
            } finally {
                a.free()
            }
        }
        ),
        i
    }
}
function Al(e, t) {
    const n = new Map
      , r = new Map;
    let i, o, s;
    const a = (f, _) => {
        if (s != null && i === f && o === _)
            return s;
        let p = r.get(f);
        p == null && (p = new Map,
        r.set(f, p));
        let w = p.get(_);
        return w == null && (w = e.buildHeightmap(f, _),
        p.set(_, w)),
        i = f,
        o = _,
        s = w,
        w
    }
      , c = (f, _, p) => {
        let w = n.get(f);
        w == null && (w = new Map,
        n.set(f, w));
        let v = w.get(p);
        v == null && (v = new Set,
        w.set(p, v)),
        v.add(_)
    }
      , l = (f, _, p) => {
        const w = f >> 4
          , v = _ >> 4
          , T = a(w, v)
          , B = (f & 15) * 16 + (_ & 15);
        return T[B]
    }
    ;
    return {
        setBlock: c,
        hasBlock: (f, _, p) => {
            const w = l(f, p);
            return _ <= w ? !0 : n.get(f)?.get(p)?.has(_) ?? !1
        }
        ,
        getHeight: l,
        resetBlocks: () => {
            n.clear()
        }
    }
}
function Fl(e, t, n) {
    const [r,i,o] = n;
    e.setBlock(r, i, o),
    fs(e, r, i, o, r, o, t, 0)
}
const X = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3
}
  , Pl = {
    [X.NORTH]: X.SOUTH,
    [X.SOUTH]: X.NORTH,
    [X.EAST]: X.WEST,
    [X.WEST]: X.EAST
};
function Ji(e, t, n, r, i) {
    return (i === X.EAST || !e.hasBlock(t + 1, n, r)) && (i === X.WEST || !e.hasBlock(t - 1, n, r)) && (i === X.SOUTH || !e.hasBlock(t, n, r + 1)) && (i === X.NORTH || !e.hasBlock(t, n, r - 1))
}
function fs(e, t, n, r, i, o, s, a) {
    let l = s.nextInt(4) + 1;
    a === 0 && (l += 1);
    for (let d = 0; d < l; d++) {
        const f = n + d + 1;
        if (!Ji(e, t, f, r))
            return;
        e.setBlock(t, f, r),
        e.setBlock(t, f - 1, r)
    }
    let u = !1;
    if (a < 4) {
        let d = s.nextInt(4);
        a === 0 && (d += 1);
        const f = n + l;
        for (let _ = 0; _ < d; _++) {
            const p = s.nextInt(4);
            let w = t
              , v = r;
            p === X.NORTH ? v -= 1 : p === X.EAST ? w += 1 : p === X.SOUTH ? v += 1 : w -= 1,
            !(w <= i - 8 || w >= i + 8 || v <= o - 8 || v >= o + 8 || e.hasBlock(w, f, v) || e.hasBlock(w, f - 1, v) || !Ji(e, w, f, v, Pl[p])) && (u = !0,
            e.setBlock(w, f, v),
            p === X.NORTH ? e.setBlock(w, f, v + 1) : p === X.EAST ? e.setBlock(w - 1, f, v) : p === X.SOUTH ? e.setBlock(w, f, v - 1) : e.setBlock(w + 1, f, v),
            fs(e, w, f, v, i, o, s, a + 1))
        }
    }
    u || e.setBlock(t, n + 1, r)
}
const Rl = () => (e, t, n) => {
    const {random: r} = t;
    if (r.nextInt(700) !== 0)
        return;
    const i = 0
      , o = e[0] + r.nextInt(16)
      , s = e[2] + r.nextInt(16);
    n([o, i, s])
}
  , zl = {
    supportsWorld: e => N(g.EndGateway, e),
    create: async function(e, t) {
        return e.edition === h.Java ? e.javaVersion >= m.V1_18 ? Ll(e, t.end) : Nl(e, t.end) : Hl(e, t.end)
    }
};
function Ll(e, t) {
    return async n => {
        const r = [];
        return ie(n, (i, o) => {
            const s = He(e, i, o, {
                decorationStepOrdinal: 4,
                featureIndex: 0,
                placement: [De({
                    chance: 700
                }), et(), Ot({
                    provider: t,
                    allowedBiomes: [Tn]
                })],
                feature: Dt()
            });
            s.length < 1 || r.push([i, o, [{
                x: s[0][0][0],
                z: s[0][0][2]
            }]])
        }
        ),
        r
    }
}
function Nl(e, t) {
    return async n => {
        const r = [];
        return ie(n, (i, o) => {
            const s = He(e, i, o, {
                decorationStepOrdinal: 4,
                featureIndex: 13,
                decorator: e.javaVersion >= m.V1_17 ? [et(), De({
                    chance: 700
                })] : [Rl()],
                feature: Dt()
            });
            s.length < 1 || t.getNoiseBiome(i * 4 + 2, 0, o * 4 + 2) !== Tn.id || r.push([i, o, [{
                x: s[0][0][0],
                z: s[0][0][2]
            }]])
        }
        ),
        r
    }
}
function Hl(e, t) {
    const n = new Yo(e)
      , r = new ee(e.seed)
      , i = e.bedrockVersion >= x.V1_18
      , o = Tn.id
      , s = async a => {
        const c = Fn(e)
          , l = Al(n)
          , u = new Map
          , d = a.x + a.sizeX
          , f = a.z + a.sizeZ
          , _ = yt(a, {
            x0: -1,
            z0: -1
        })
          , p = _.sizeX
          , w = t.getBiomeArea(_.x * 4, _.z * 4, p, _.sizeZ, 4);
        let v = 0;
        for (let B = _.z; B < _.z + _.sizeZ; B++)
            for (let k = _.x; k < _.x + _.sizeX; k++) {
                if (w[v] !== o) {
                    v += 1;
                    continue
                }
                v += 1,
                l.resetBlocks();
                const A = c(k, B);
                r.setSeed(A),
                i && r.nextInt();
                const P = r.nextInt(5)
                  , E = k * 16 + 8
                  , I = B * 16 + 8;
                for (let U = 0; U < P; U++) {
                    const Y = E + r.nextInt(16)
                      , te = I + r.nextInt(16)
                      , W = l.getHeight(Y, te) + 1;
                    W <= 0 || Fl(l, r, [Y, W, te])
                }
                if (r.nextInt(700) !== 0)
                    continue;
                const O = E + r.nextInt(16)
                  , M = I + r.nextInt(16);
                if (l.getHeight(O, M, !0) <= 0)
                    continue;
                const F = O >> 4
                  , z = M >> 4;
                if (F < a.x || F >= d || z < a.z || z >= f)
                    continue;
                let H = u.get(F);
                H == null && (H = new Map,
                u.set(F, H));
                let Q = H.get(z);
                Q == null && (Q = [],
                H.set(z, Q)),
                Q.push({
                    x: O,
                    z: M
                })
            }
        const T = [];
        for (const [B,k] of u)
            for (const [A,P] of k)
                T.push([B, A, P]);
        return T
    }
    ;
    return s.free = () => {
        r.free(),
        n.free()
    }
    ,
    s
}
const Dl = e => t => {
    const {x: n=0, y: r=0, z: i=0} = e;
    return [[t[0] + n, t[1] + r, t[2] + i]]
}
  , Wl = {
    supportsWorld: e => N(g.AmethystGeode, e),
    create: async (e, t) => e.edition === h.Java ? Gl(e, t.overworld) : Jl(e)
}
  , jl = e => [qe.id, Qe.id].includes(e) ? 2 : 0;
function Gl(e, t) {
    return async n => {
        const r = yt(n, {
            x0: -1,
            z0: -1
        })
          , i = []
          , o = e.javaVersion < m.V1_18 ? t.legacy().getNoiseBiomeArea(r.x * 4 + 2, r.z * 4 + 2, (r.x + r.sizeX) * 4 - 2, (r.z + r.sizeZ) * 4 - 2) : null;
        return ie(r, (s, a) => {
            const c = o?.(s * 4 + 2, a * 4 + 2).id
              , l = He(e, s, a, {
                decorationStepOrdinal: 2,
                featureIndex: c == null || e.javaVersion >= m.V1_18 ? 2 : jl(c),
                decorator: [_n.uniform({
                    minInclusive: e.javaVersion >= m.V1_18 ? -58 : 6,
                    maxInclusive: e.javaVersion >= m.V1_18 ? 30 : 46
                }), et(), De({
                    chance: e.javaVersion >= m.V1_18 ? 24 : 53
                })],
                feature: Dl({
                    x: 4,
                    y: 4,
                    z: 4
                })
            });
            l.length > 0 && i.push(l[0][0])
        }
        ),
        Zo(i, n, s => [s[0] >> 4, s[2] >> 4])
    }
}
function Jl(e) {
    const t = new mn(e,"minecraft:overworld_amethyst_geode_feature")
      , n = e.bedrockVersion >= x.V1_18 ? 24 : 53
      , r = e.bedrockVersion >= x.V1_18 ? [-58, 30] : [6, 47]
      , i = async o => {
        const s = [];
        return ie(o, (a, c) => {
            const l = t.getSeedForChunk(a, c)
              , u = new ee(l);
            if (u.nextInt(n) < 1) {
                const d = yr(u, r[0], r[1]);
                s.push([a * 16 + 4, d + 4, c * 16 + 4])
            }
            u.free()
        }
        ),
        Zo(s, o, a => [a[0] >> 4, a[2] >> 4])
    }
    ;
    return i.free = () => {
        t.free()
    }
    ,
    i
}
const Ul = [["city_center_1", 1, [18, 31, 41]], ["city_center_2", 1, [18, 31, 41]], ["city_center_3", 1, [18, 31, 41]]]
  , Zl = {
    supportsWorld: e => N(g.AncientCity, e),
    create: async (e, t) => {
        const n = t.overworld.noise();
        return J(e, {
            spacing: 24,
            separation: 8,
            salt: 20083232,
            linearSeparation: e.edition !== h.Bedrock
        }, async (r, i) => e.edition === h.Java ? !!it({
            world: e,
            biomeProvider: t.overworld.noise(),
            chunkX: r,
            chunkZ: i,
            initialY: -27,
            projectionY: null,
            allowedBiomes: [kt],
            structures: Ul,
            namedStartPos: [13, 20]
        }) : n.getNoiseBiomeBlock(r * 16, -27, i * 16) === kt.id)
    }
}
  , Kl = "minecraft:chest"
  , Xl = [{
    bonus_rolls: 0,
    entries: [{
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 3,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:diamond",
        weight: 5
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 5,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:iron_ingot",
        weight: 15
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 7,
                min: 2
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:gold_ingot",
        weight: 15
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 3,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:emerald",
        weight: 15
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 6,
                min: 4
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:bone",
        weight: 25
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 3,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:spider_eye",
        weight: 25
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 7,
                min: 3
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:rotten_flesh",
        weight: 25
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 5,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:leather",
        weight: 20
    }, {
        type: "minecraft:item",
        name: "minecraft:copper_horse_armor",
        weight: 15
    }, {
        type: "minecraft:item",
        name: "minecraft:iron_horse_armor",
        weight: 15
    }, {
        type: "minecraft:item",
        name: "minecraft:golden_horse_armor",
        weight: 10
    }, {
        type: "minecraft:item",
        name: "minecraft:diamond_horse_armor",
        weight: 5
    }, {
        type: "minecraft:item",
        functions: [{
            function: "minecraft:enchant_randomly",
            options: "#minecraft:on_random_loot"
        }],
        name: "minecraft:book",
        weight: 20
    }, {
        type: "minecraft:item",
        name: "minecraft:golden_apple",
        weight: 20
    }, {
        type: "minecraft:item",
        name: "minecraft:enchanted_golden_apple",
        weight: 2
    }, {
        type: "minecraft:empty",
        weight: 15
    }],
    rolls: {
        type: "minecraft:uniform",
        max: 4,
        min: 2
    }
}, {
    bonus_rolls: 0,
    entries: [{
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 8,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:bone",
        weight: 10
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 8,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:gunpowder",
        weight: 10
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 8,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:rotten_flesh",
        weight: 10
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 8,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:string",
        weight: 10
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 8,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:sand",
        weight: 10
    }],
    rolls: 4
}, {
    bonus_rolls: 0,
    entries: [{
        type: "minecraft:empty",
        weight: 6
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: 2,
            function: "minecraft:set_count"
        }],
        name: "minecraft:dune_armor_trim_smithing_template"
    }],
    rolls: 1
}]
  , $l = "minecraft:chests/desert_pyramid";
var ql = {
    type: Kl,
    pools: Xl,
    random_sequence: $l
};
const Ql = "minecraft:chest"
  , Yl = [{
    bonus_rolls: 0,
    entries: [{
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 3,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:diamond",
        weight: 5
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 5,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:iron_ingot",
        weight: 15
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 7,
                min: 2
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:gold_ingot",
        weight: 15
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 3,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:emerald",
        weight: 15
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 6,
                min: 4
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:bone",
        weight: 25
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 3,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:spider_eye",
        weight: 25
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 7,
                min: 3
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:rotten_flesh",
        weight: 25
    }, {
        type: "minecraft:item",
        name: "minecraft:saddle",
        weight: 20
    }, {
        type: "minecraft:item",
        name: "minecraft:iron_horse_armor",
        weight: 15
    }, {
        type: "minecraft:item",
        name: "minecraft:golden_horse_armor",
        weight: 10
    }, {
        type: "minecraft:item",
        name: "minecraft:diamond_horse_armor",
        weight: 5
    }, {
        type: "minecraft:item",
        functions: [{
            function: "minecraft:enchant_randomly"
        }],
        name: "minecraft:book",
        weight: 20
    }, {
        type: "minecraft:item",
        name: "minecraft:golden_apple",
        weight: 20
    }, {
        type: "minecraft:item",
        name: "minecraft:enchanted_golden_apple",
        weight: 2
    }, {
        type: "minecraft:empty",
        weight: 15
    }],
    rolls: {
        type: "minecraft:uniform",
        max: 4,
        min: 2
    }
}, {
    bonus_rolls: 0,
    entries: [{
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 8,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:bone",
        weight: 10
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 8,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:gunpowder",
        weight: 10
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 8,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:rotten_flesh",
        weight: 10
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 8,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:string",
        weight: 10
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: {
                type: "minecraft:uniform",
                max: 8,
                min: 1
            },
            function: "minecraft:set_count"
        }],
        name: "minecraft:sand",
        weight: 10
    }],
    rolls: 4
}, {
    bonus_rolls: 0,
    entries: [{
        type: "minecraft:empty",
        weight: 6
    }, {
        type: "minecraft:item",
        functions: [{
            add: !1,
            count: 2,
            function: "minecraft:set_count"
        }],
        name: "minecraft:dune_armor_trim_smithing_template"
    }],
    rolls: 1
}];
var eu = {
    type: Ql,
    pools: Yl
};
const tu = [{
    rolls: {
        min: 2,
        max: 4
    },
    entries: [{
        type: "item",
        name: "minecraft:diamond",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 3
            }
        }],
        weight: 5
    }, {
        type: "item",
        name: "minecraft:iron_ingot",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 5
            }
        }],
        weight: 15
    }, {
        type: "item",
        name: "minecraft:gold_ingot",
        functions: [{
            function: "set_count",
            count: {
                min: 2,
                max: 7
            }
        }],
        weight: 15
    }, {
        type: "item",
        name: "minecraft:emerald",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 3
            }
        }],
        weight: 15
    }, {
        type: "item",
        name: "minecraft:bone",
        functions: [{
            function: "set_count",
            count: {
                min: 4,
                max: 6
            }
        }],
        weight: 25
    }, {
        type: "item",
        name: "minecraft:spider_eye",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 3
            }
        }],
        weight: 25
    }, {
        type: "item",
        name: "minecraft:rotten_flesh",
        functions: [{
            function: "set_count",
            count: {
                min: 3,
                max: 7
            }
        }],
        weight: 25
    }, {
        type: "item",
        name: "minecraft:leather",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 5
            },
            add: !1
        }],
        weight: 20
    }, {
        type: "item",
        name: "minecraft:horsearmoriron",
        weight: 15
    }, {
        type: "item",
        name: "minecraft:horsearmorgold",
        weight: 10
    }, {
        type: "item",
        name: "minecraft:horsearmordiamond",
        weight: 5
    }, {
        type: "item",
        name: "minecraft:book",
        weight: 20,
        functions: [{
            function: "enchant_randomly"
        }]
    }, {
        type: "item",
        name: "minecraft:golden_apple",
        weight: 20
    }, {
        type: "item",
        name: "minecraft:appleEnchanted",
        weight: 2
    }, {
        type: "empty",
        weight: 15
    }]
}, {
    rolls: 4,
    entries: [{
        type: "item",
        name: "minecraft:bone",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:gunpowder",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:rotten_flesh",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:string",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:sand",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }]
}, {
    rolls: 1,
    entries: [{
        type: "empty",
        weight: 6
    }, {
        type: "item",
        name: "minecraft:dune_armor_trim_smithing_template",
        weight: 1,
        functions: [{
            function: "set_count",
            count: 2
        }]
    }]
}];
var nu = {
    pools: tu
};
const ru = [{
    rolls: {
        min: 2,
        max: 4
    },
    entries: [{
        type: "item",
        name: "minecraft:diamond",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 3
            }
        }],
        weight: 5
    }, {
        type: "item",
        name: "minecraft:iron_ingot",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 5
            }
        }],
        weight: 15
    }, {
        type: "item",
        name: "minecraft:gold_ingot",
        functions: [{
            function: "set_count",
            count: {
                min: 2,
                max: 7
            }
        }],
        weight: 15
    }, {
        type: "item",
        name: "minecraft:emerald",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 3
            }
        }],
        weight: 15
    }, {
        type: "item",
        name: "minecraft:bone",
        functions: [{
            function: "set_count",
            count: {
                min: 4,
                max: 6
            }
        }],
        weight: 25
    }, {
        type: "item",
        name: "minecraft:spider_eye",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 3
            }
        }],
        weight: 25
    }, {
        type: "item",
        name: "minecraft:rotten_flesh",
        functions: [{
            function: "set_count",
            count: {
                min: 3,
                max: 7
            }
        }],
        weight: 25
    }, {
        type: "item",
        name: "minecraft:saddle",
        weight: 20
    }, {
        type: "item",
        name: "minecraft:horsearmoriron",
        weight: 15
    }, {
        type: "item",
        name: "minecraft:horsearmorgold",
        weight: 10
    }, {
        type: "item",
        name: "minecraft:horsearmordiamond",
        weight: 5
    }, {
        type: "item",
        name: "minecraft:book",
        weight: 20,
        functions: [{
            function: "enchant_randomly"
        }]
    }, {
        type: "item",
        name: "minecraft:golden_apple",
        weight: 20
    }, {
        type: "item",
        name: "minecraft:appleEnchanted",
        weight: 2
    }, {
        type: "empty",
        weight: 15
    }]
}, {
    rolls: 4,
    entries: [{
        type: "item",
        name: "minecraft:bone",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:gunpowder",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:rotten_flesh",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:string",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:sand",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }]
}];
var iu = {
    pools: ru
};
const ou = [{
    rolls: {
        min: 2,
        max: 4
    },
    entries: [{
        type: "item",
        name: "minecraft:diamond",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 3
            }
        }],
        weight: 5
    }, {
        type: "item",
        name: "minecraft:iron_ingot",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 5
            }
        }],
        weight: 15
    }, {
        type: "item",
        name: "minecraft:gold_ingot",
        functions: [{
            function: "set_count",
            count: {
                min: 2,
                max: 7
            }
        }],
        weight: 15
    }, {
        type: "item",
        name: "minecraft:emerald",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 3
            }
        }],
        weight: 15
    }, {
        type: "item",
        name: "minecraft:bone",
        functions: [{
            function: "set_count",
            count: {
                min: 4,
                max: 6
            }
        }],
        weight: 25
    }, {
        type: "item",
        name: "minecraft:spider_eye",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 3
            }
        }],
        weight: 25
    }, {
        type: "item",
        name: "minecraft:rotten_flesh",
        functions: [{
            function: "set_count",
            count: {
                min: 3,
                max: 7
            }
        }],
        weight: 25
    }, {
        type: "item",
        name: "minecraft:leather",
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 5
            },
            add: !1
        }],
        weight: 20
    }, {
        type: "item",
        name: "minecraft:horsearmoriron",
        weight: 15
    }, {
        type: "item",
        name: "minecraft:copper_horse_armor",
        weight: 15
    }, {
        type: "item",
        name: "minecraft:horsearmorgold",
        weight: 10
    }, {
        type: "item",
        name: "minecraft:horsearmordiamond",
        weight: 5
    }, {
        type: "item",
        name: "minecraft:book",
        weight: 20,
        functions: [{
            function: "enchant_randomly"
        }]
    }, {
        type: "item",
        name: "minecraft:golden_apple",
        weight: 20
    }, {
        type: "item",
        name: "minecraft:appleEnchanted",
        weight: 2
    }, {
        type: "empty",
        weight: 15
    }]
}, {
    rolls: 4,
    entries: [{
        type: "item",
        name: "minecraft:bone",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:gunpowder",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:rotten_flesh",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:string",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }, {
        type: "item",
        name: "minecraft:sand",
        weight: 10,
        functions: [{
            function: "set_count",
            count: {
                min: 1,
                max: 8
            }
        }]
    }]
}, {
    rolls: 1,
    entries: [{
        type: "empty",
        weight: 6
    }, {
        type: "item",
        name: "minecraft:dune_armor_trim_smithing_template",
        weight: 1,
        functions: [{
            function: "set_count",
            count: 2
        }]
    }]
}];
var su = {
    pools: ou
};
const br = (e, t) => {
    if (Array.isArray(e))
        for (let n = 0; n < e.length; n++)
            typeof e[n] == "string" ? e[n] = t(e[n]) : br(e[n], t);
    if (typeof e == "object" && e !== null) {
        const n = e;
        for (const [r,i] of Object.entries(e))
            typeof i == "string" ? n[r] = t(i) : br(n[r], t)
    }
}
  , au = (e, t) => {
    if (e.edition === h.Java && e.javaVersion >= m.V1_21_9)
        return ql;
    if (e.edition === h.Java && e.javaVersion >= m.V1_18)
        return eu;
    if (e.edition === h.Bedrock && e.bedrockVersion >= x.V1_21_110)
        return su;
    if (e.edition === h.Bedrock && e.bedrockVersion >= x.V1_21_90)
        return nu;
    if (e.edition === h.Bedrock && e.bedrockVersion >= x.V1_18)
        return iu;
    throw new Error(`Loot table ${t} not found`)
}
  , cu = (e, t) => {
    const n = au(e, t);
    return br(n, r => r.startsWith("minecraft:") ? r.slice(10) : r),
    n
}
  , lu = [{
    name: "protection",
    category: "ARMOR",
    minLevel: 1,
    maxLevel: 4
}, {
    name: "fire_protection",
    category: "ARMOR",
    minLevel: 1,
    maxLevel: 4
}, {
    name: "feather_falling",
    category: "ARMOR_FEET",
    minLevel: 1,
    maxLevel: 4
}, {
    name: "blast_protection",
    category: "ARMOR",
    minLevel: 1,
    maxLevel: 4
}, {
    name: "projectile_protection",
    category: "ARMOR",
    minLevel: 1,
    maxLevel: 4
}, {
    name: "respiration",
    category: "ARMOR_HEAD",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "aqua_affinity",
    category: "ARMOR_HEAD",
    minLevel: 1,
    maxLevel: 1
}, {
    name: "thorns",
    category: "ARMOR_CHEST",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "depth_strider",
    category: "ARMOR_FEET",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "frost_walker",
    category: "ARMOR_FEET",
    minLevel: 1,
    maxLevel: 2
}, {
    name: "binding_curse",
    category: "WEARABLE",
    minLevel: 1,
    maxLevel: 1
}, {
    name: "sharpness",
    category: "WEAPON",
    minLevel: 1,
    maxLevel: 5
}, {
    name: "smite",
    category: "WEAPON",
    minLevel: 1,
    maxLevel: 5
}, {
    name: "bane_of_arthropods",
    category: "WEAPON",
    minLevel: 1,
    maxLevel: 5
}, {
    name: "knockback",
    category: "WEAPON",
    minLevel: 1,
    maxLevel: 2
}, {
    name: "fire_aspect",
    category: "WEAPON",
    minLevel: 1,
    maxLevel: 2
}, {
    name: "looting",
    category: "WEAPON",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "sweeping",
    category: "WEAPON",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "efficiency",
    category: "DIGGER",
    minLevel: 1,
    maxLevel: 5
}, {
    name: "silk_touch",
    category: "DIGGER",
    minLevel: 1,
    maxLevel: 1
}, {
    name: "unbreaking",
    category: "BREAKABLE",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "fortune",
    category: "DIGGER",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "power",
    category: "BOW",
    minLevel: 1,
    maxLevel: 5
}, {
    name: "punch",
    category: "BOW",
    minLevel: 1,
    maxLevel: 2
}, {
    name: "flame",
    category: "BOW",
    minLevel: 1,
    maxLevel: 1
}, {
    name: "infinity",
    category: "BOW",
    minLevel: 1,
    maxLevel: 1
}, {
    name: "luck_of_the_sea",
    category: "FISHING_ROD",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "lure",
    category: "FISHING_ROD",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "loyalty",
    category: "TRIDENT",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "impaling",
    category: "TRIDENT",
    minLevel: 1,
    maxLevel: 5
}, {
    name: "riptide",
    category: "TRIDENT",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "channeling",
    category: "TRIDENT",
    minLevel: 1,
    maxLevel: 1
}, {
    name: "multishot",
    category: "CROSSBOW",
    minLevel: 1,
    maxLevel: 1
}, {
    name: "quick_charge",
    category: "CROSSBOW",
    minLevel: 1,
    maxLevel: 3
}, {
    name: "piercing",
    category: "CROSSBOW",
    minLevel: 1,
    maxLevel: 4
}, {
    name: "mending",
    category: "BREAKABLE",
    minLevel: 1,
    maxLevel: 1
}, {
    name: "vanishing_curse",
    category: "VANISHABLE",
    minLevel: 1,
    maxLevel: 1
}]
  , uu = {
    golden_sword: [11, 12, 13, 14, 15, 16, 17, 20, 35, 36],
    golden_axe: [11, 12, 13, 18, 19, 20, 21, 35, 36],
    golden_hoe: [18, 19, 20, 21, 35, 36],
    golden_shovel: [18, 19, 20, 21, 35, 36],
    golden_pickaxe: [18, 19, 20, 21, 35, 36],
    golden_boots: [0, 1, 2, 3, 4, 7, 8, 9, 10, 20, 35, 36],
    golden_chestplate: [0, 1, 3, 4, 7, 10, 20, 35, 36],
    golden_helmet: [0, 1, 3, 4, 5, 6, 7, 10, 20, 35, 36],
    golden_leggings: [0, 1, 3, 4, 7, 10, 20, 35, 36]
}
  , fu = e => lu
  , du = (e, t) => {
    const n = fu();
    if (t === "book")
        return n;
    const r = uu[t];
    if (!r)
        throw new Error("Enchantments for " + t + " unknown");
    return r.map(i => n[i])
}
;
function gu({world: e, lootTableKey: t, randomSeed: n}) {
    const r = cu(e, t)
      , i = e.edition === h.Java ? new ge(n) : new ee(n)
      , o = [];
    try {
        for (const s of r.pools) {
            const a = s.entries.reduce( (l, u) => l + (u.weight ?? 1), 0);
            if (a <= 0 || s.entries.length < 1)
                continue;
            let c = null;
            e.edition === h.Bedrock && i.nextFloat(),
            typeof s.rolls == "number" ? (e.edition === h.Bedrock && i.nextInt(),
            c = s.rolls) : c = wr(s.rolls.min, s.rolls.max, i);
            for (let l = 0; l < c; l++)
                if (e.edition === h.Java && s.entries.length === 1)
                    s.entries[0].type === "item" && o.push(Ui(s.entries[0], i, e));
                else {
                    let u = i.nextInt(a);
                    for (const d of s.entries)
                        if (u -= d.weight ?? 1,
                        u < 0) {
                            d.type === "item" && o.push(Ui(d, i, e));
                            break
                        }
                }
        }
    } finally {
        i.free()
    }
    return o
}
function Ui(e, t, n) {
    return (e.functions || []).reduce( (r, i) => _u(r, i, t, n), {
        name: e.name,
        count: 1
    })
}
function _u(e, t, n, r) {
    if (t.function === "set_data")
        return e;
    if (t.function === "set_count")
        return r.edition === h.Bedrock && t.count.min === t.count.max && n.nextInt(1),
        {
            ...e,
            count: wr(t.count.min, t.count.max, n)
        };
    if (t.function === "enchant_randomly") {
        if (r.edition === h.Bedrock)
            return n.nextInt(),
            {
                ...e,
                enchantment: "unknown"
            };
        const i = du(r, e.name)
          , {name: o, minLevel: s, maxLevel: a} = i[n.nextInt(i.length)]
          , c = wr(s, a, n);
        return {
            name: e.name === "book" ? "enchanted_book" : e.name,
            count: 1,
            enchantment: {
                name: o,
                level: c
            }
        }
    }
    throw new Error(`Function ${t.function} not implemented`)
}
function wr(e, t, n) {
    const r = Math.floor(e)
      , i = Math.floor(t);
    return r >= i ? r : n.nextInt(i - r + 1) + r
}
const mu = e => e.reduce( (t, n) => t.concat(n), [])
  , hu = {
    enchanted_golden_apple: ["enchanted_golden_apple", "appleEnchanted"]
}
  , pu = {
    supportsWorld: e => N(g.ItemOverworld, e),
    create: async (e, t, n) => {
        const r = await ns.create(e, t, n)
          , i = yu(e);
        return async o => {
            const s = await r(o)
              , a = [];
            for (const c of s) {
                const l = i(c);
                mu(l.map(f => gu({
                    world: e,
                    lootTableKey: "desert_pyramid",
                    randomSeed: f
                }))).find(f => hu.enchanted_golden_apple.includes(f.name)) && a.push([...c, [{
                    item: "enchanted_golden_apple"
                }]])
            }
            return a
        }
    }
}
  , yu = e => {
    if (e.edition === h.Bedrock) {
        const t = Fn(e);
        return n => {
            const r = new ee(t(n[0], n[1]));
            r.nextInt();
            const i = [V.fromInt(r.nextInt()), V.fromInt(r.nextInt()), V.fromInt(r.nextInt()), V.fromInt(r.nextInt())];
            return r.free(),
            i
        }
    } else
        return t => {
            const n = Do(e, t[0] * 16, t[1] * 16)
              , r = us(e, n, e.javaVersion >= m.V1_19_3 ? 1 : 3, 4);
            r.nextInt(3);
            const i = [r.nextLong(), r.nextLong(), r.nextLong(), r.nextLong()];
            return r.free(),
            i
        }
}
  , bu = {
    supportsWorld: e => N(g.OreVein, e),
    async create(e, t) {
        const n = new Pa(e)
          , r = t.overworld.noise()
          , i = async o => {
            const s = n.find(o, r);
            return Fe(s, a => [a.reference[0] >> 4, a.reference[2] >> 4])
        }
        ;
        return i.free = () => n.free(),
        i
    }
};
class wu {
    rustFinder;
    constructor(t) {
        this.rustFinder = new nr(be(t))
    }
    find(t, n) {
        return this.rustFinder.find(t.provider, n.x, n.z, n.sizeX, n.sizeZ)
    }
    free() {
        this.rustFinder.free()
    }
}
const vu = {
    supportsWorld: e => N(g.Cave, e),
    async create(e, t) {
        const n = new wu(e)
          , r = t.overworld.noise()
          , i = async o => {
            const s = n.find(r, o);
            return Fe(s, a => [a.reference.pos[0] >> 4, a.reference.pos[2] >> 4])
        }
        ;
        return i.free = () => n.free(),
        i
    }
}
  , xu = ({provider: e, heightType: t}) => (n, r, i) => {
    i([n[0], e.getSurfaceBlock(n[0], n[2], t, "topmostAccurate"), n[2]])
}
  , Su = {
    supportsWorld: e => N(g.DesertWell, e),
    create: async function(e, t) {
        return e.edition === h.Java ? Cu(e, t.overworld.noise()) : Tu(e, t.overworld)
    }
};
function ds(e, t) {
    const n = t[0];
    let r = t[1] + 1;
    const i = t[2];
    let o = null;
    for (; (o = e.getNoiseBlock(n, r, i, !1)) === St.Air; )
        r -= 1;
    if (!Ra(o))
        return null;
    for (let s = -2; s <= 2; s++)
        for (let a = -2; a <= 2; a++)
            if (e.getNoiseBlock(n + s, r - 1, i + a, !1) === St.Air && e.getNoiseBlock(n + s, r - 2, i + a, !1) === St.Air)
                return null;
    return r
}
function Cu(e, t) {
    return async n => {
        const r = [];
        return ie(n, (i, o) => {
            const s = He(e, i, o, {
                decorationStepOrdinal: 4,
                featureIndex: 2,
                placement: [De({
                    chance: 1e3
                }), et(), xu({
                    provider: t,
                    heightType: "oceanFloor"
                }), Ot({
                    provider: t,
                    allowedBiomes: [q]
                })],
                feature: Dt()
            });
            if (s.length < 1)
                return;
            const a = ds(t, s[0][0]);
            if (a == null)
                return;
            const c = [s[0][0][0], a, s[0][0][2]];
            r.push([i, o, c])
        }
        ),
        r
    }
}
function Tu(e, t) {
    const n = t.noise()
      , r = new mn(e,"minecraft:desert_after_surface_desert_well_feature")
      , i = (s, a, c) => Pn(n, s, a, c) === q
      , o = async s => {
        const a = [];
        return ie(s, (c, l) => {
            if (!i(c * 16 + 8, 128, l * 16 + 8))
                return;
            const u = r.getSeedForChunk(c, l)
              , d = new ee(u);
            if (d.nextInt(500) >= 1) {
                d.free();
                return
            }
            const f = l * 16 + yr(d, 0, 16)
              , _ = c * 16 + yr(d, 0, 16);
            if (d.free(),
            !i(_, 128, f))
                return;
            const p = n.getSurfaceBlock(_, f, "oceanFloor", "topmostAccurate")
              , w = ds(n, [_, p, f]);
            w != null && a.push([c, l, [_, w, f]])
        }
        ),
        a
    }
    ;
    return o.free = () => {
        r.free()
    }
    ,
    o
}
const Bu = [["tower_1", 1, [5, 13, 5]], ["tower_2", 1, [5, 13, 5]], ["tower_3", 1, [7, 13, 7]], ["tower_4", 1, [7, 13, 7]], ["tower_5", 1, [7, 13, 7]]]
  , Zi = [_e, Ae, Pt, En, Bn, pt]
  , Eu = {
    supportsWorld: e => N(g.TrailRuin, e),
    create: async (e, t) => {
        const n = t.overworld.noise()
          , r = e.edition === h.Bedrock && e.bedrockVersion >= x.V1_20_60;
        return J(e, {
            spacing: 34,
            separation: 8,
            salt: 83469867,
            linearSeparation: e.edition === h.Java || r,
            forceRngType: r ? "java" : void 0
        }, async (i, o) => {
            if (e.edition === h.Java || r) {
                const c = it({
                    world: e,
                    biomeProvider: t.overworld.noise(),
                    chunkX: i,
                    chunkZ: o,
                    initialY: -15,
                    projectionY: {
                        heightType: "worldSurface",
                        surfaceCheckType: "topmostAccurate"
                    },
                    allowedBiomes: Zi,
                    structures: Bu
                });
                return c ? [c.x, c.y + 10, c.z] : !1
            }
            const s = n.getPreliminarySurfaceLevel(i * 4, o * 4)
              , a = Me(n.getNoiseBiomeBlock(i * 16, s - 20, o * 16));
            return Zi.includes(a) ? [i * 16 + 8, null, o * 16 + 8] : !1
        }
        , (i, o, s, a) => a)
    }
}
  , Vu = (e, t) => e !== kt && (t.edition === h.Java || e !== An)
  , ku = [["end_1", 1, [19, 20, 19]], ["end_2", 1, [19, 20, 19]]]
  , Iu = {
    supportsWorld: e => N(g.TrialChamber, e),
    async create(e, t) {
        return J(e, {
            spacing: 34,
            separation: 12,
            linearSeparation: !0,
            salt: 94251327,
            forceRngType: "java"
        }, async (n, r) => it({
            world: e,
            biomeProvider: t.overworld.noise(),
            chunkX: n,
            chunkZ: r,
            initialY: ({rng: i}) => Rn(i, -40, -20),
            projectionY: null,
            allowedBiomes: i => Vu(i, e),
            structures: ku
        }), (n, r, i, o) => [o.x, o.y, o.z], {
            x0: 0,
            z0: 0,
            x1: 1,
            z1: 1
        }, n => [n[0] >> 4, n[2] >> 4], !0)
    }
};
class Ou {
    rustFinder;
    constructor(t) {
        this.rustFinder = new sr(be(t))
    }
    find(t, n) {
        return this.rustFinder.find(t.provider, n.x, n.z, n.sizeX, n.sizeZ)
    }
    free() {
        this.rustFinder.free()
    }
}
class Mu {
    helper;
    constructor(t) {
        this.helper = new ar(be(t))
    }
    findPositionsBedrock(t, n, r, i, o) {
        return this.helper.find_positions_bedrock(t.provider, n, r, i, o)
    }
    testFeaturePositionsJava(t, n) {
        return this.helper.test_feature_positions_java(t.provider, n)
    }
    free() {
        this.helper.free()
    }
}
const Au = {
    supportsWorld: e => N(g.LavaPool, e),
    create: async (e, t) => {
        const n = new Ou(e)
          , r = new Mu(e)
          , i = t.overworld.noise()
          , o = async s => {
            const a = n.find(i, s)
              , c = e.edition === h.Bedrock ? await Fu(e, s, r, i) : await Pu(e, s, r, i)
              , l = [...a.map(u => ({
                type: "cave",
                pos: u.reference.pos,
                count: u.count
            })), ...c.map(u => ({
                type: "undergroundLake",
                pos: u
            }))];
            return Fe(l, u => [u.pos[0] >> 4, u.pos[2] >> 4]).filter(u => Ne(s, {
                x: u[0],
                z: u[1]
            }))
        }
        ;
        return o.free = () => {
            n.free(),
            r.free()
        }
        ,
        o
    }
};
async function Fu(e, t, n, r) {
    const i = yt(t, {
        x1: 1,
        z1: 1
    });
    return (await jr(async s => {
        const a = n.findPositionsBedrock(r, s.x, s.z, s.sizeX, s.sizeZ);
        return Fe(a, c => [c[0] >> 4, c[2] >> 4])
    }
    , 20)(i)).reduce( (s, a) => (s.push(...a[2]),
    s), [])
}
async function Pu(e, t, n, r) {
    const i = yt(t, {
        x0: -1,
        z0: -1
    });
    return (await jr(async s => {
        const a = [];
        if (ie(s, (l, u) => {
            const d = He(e, l, u, {
                decorationStepOrdinal: 1,
                featureIndex: 0,
                placement: [De({
                    chance: 9
                }), et(), _n.uniform({
                    minInclusive: 0,
                    maxInclusive: 319
                }), Ot({
                    provider: r,
                    disallowedBiomes: [kt]
                })],
                feature: Dt()
            }).flat();
            a.push(...d)
        }
        ),
        a.length < 1)
            return [];
        const c = n.testFeaturePositionsJava(r, a);
        return Fe(c, l => [l[0] >> 4, l[2] >> 4])
    }
    , 20)(i)).reduce( (s, a) => (s.push(...a[2]),
    s), [])
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
}
  , vr = {
    [g.BuriedTreasure]: oc,
    [g.Dungeon]: gc,
    [g.NetherFortress]: vc,
    [g.BastionRemnant]: tc,
    [g.EndCity]: mc,
    [g.SlimeChunk]: Fc,
    [g.Stronghold]: Zc,
    [g.Village]: Jr,
    [g.Mineshaft]: Qo,
    [g.WoodlandMansion]: ol,
    [g.PillagerOutpost]: cl,
    [g.OceanRuin]: gl,
    [g.OceanMonument]: Gr,
    [g.Shipwreck]: Oc,
    [g.DesertTemple]: ns,
    [g.JungleTemple]: Vc,
    [g.WitchHut]: kc,
    [g.Igloo]: Ic,
    [g.RuinedPortalOverworld]: Cc,
    [g.RuinedPortalNether]: Tc,
    [g.Spawn]: hl,
    [g.Fossil]: wl,
    [g.FossilNether]: Tl,
    [g.Ravine]: Vl,
    [g.EndGateway]: zl,
    [g.AmethystGeode]: Wl,
    [g.AncientCity]: Zl,
    [g.ItemOverworld]: pu,
    [g.OreVein]: bu,
    [g.Cave]: vu,
    [g.DesertWell]: Su,
    [g.TrailRuin]: Eu,
    [g.TrialChamber]: Iu,
    [g.LavaPool]: Au,
    [g.AbandonedCamp]: Wu
}
  , ju = (e, t) => vr[e].finiteGenerationArea?.(t) ?? null
  , Gu = (e, t, n) => {
    let r = "idle";
    const i = {}
      , o = async (s, a) => {
        if (r !== "idle")
            throw new Error(`illegal state for finding pois: ${r}`);
        r = "running";
        try {
            const c = await Promise.all(a.map(async l => {
                if (!i[l]) {
                    if (!vr[l].supportsWorld(e))
                        return [l, []];
                    i[l] = await vr[l].create(e, t, n)
                }
                return [l, await i[l](s)]
            }
            ));
            return Object.fromEntries(c)
        } finally {
            r = "idle"
        }
    }
    ;
    return o.free = () => {
        if (r !== "idle")
            throw new Error(`illegal state freeing pois: ${r}`);
        Object.values(i).forEach(s => {
            s.free && s.free()
        }
        ),
        r = "freed"
    }
    ,
    o
}
;
let xr;
function Ju(e) {
    xr = e
}
const Wt = Za(e => {
    const t = {
        [y.Overworld]: Wa(e),
        [y.Nether]: ja(e),
        [y.End]: new Nr(e)
    }
      , n = Gu(e, t, {
        sharedTask: async (r, i) => {
            const o = _r(e);
            return xr ? await xr(o + "--" + r, ho(i)) : await i()
        }
    });
    return {
        providers: t,
        poiFinder: n
    }
}
, ({providers: e, poiFinder: t}) => {
    e[y.Overworld].free(),
    e[y.Nether].free(),
    e[y.End].free(),
    t.free()
}
, _r)
  , Xi = "depth0"
  , Uu = "oceanFloor"
  , Zu = "enhancedNoCaves"
  , gs = 62;
async function Ku(e, t, n, r, i, o, s, a) {
    const c = Nt(e)
      , {providers: l} = Wt(c)
      , {biomes: u, heights: d} = Mt(l, t, n, r, i, o, s, a.mode === "biomes" ? {
        mode: "biomes",
        getBiomesAt: a.getBiomesAt ?? Xi
    } : {
        mode: "biomesAndHeights",
        getBiomesAt: a.getBiomesAt ?? Xi,
        getHeightLevelAt: a.getHeightLevelAt ?? Uu,
        surfaceCheckType: a.surfaceCheckType ?? Zu
    })
      , f = d && a.mode === "biomesAndHeights" && a.enableTerrainShading ? $u(d, i, o, s) : null
      , _ = new Uint8Array(i * o * 4)
      , p = new Uint8Array(i * o * 3)
      , w = a.biomeFilter ?? !1;
    for (let v = 0; v < u.length; v++) {
        const T = u[v]
          , B = d?.[v]
          , k = Qu({
            biome: T,
            height: B,
            shadingData: f?.[v],
            biomeFilter: w
        });
        if (_.set(k, v * 4),
        p[v * 3] = T,
        B != null) {
            let A = Math.max(-16384, Math.min(16383, B));
            A < 0 && (A += 32768),
            A |= 32768,
            p[v * 3 + 1] = A & 255,
            p[v * 3 + 2] = A >> 8 & 255
        }
    }
    return mo({
        rgba: _,
        data: p
    }, [_.buffer, p.buffer])
}
function Mt(e, t, n, r, i, o, s, a) {
    if (t === y.End) {
        if (a.mode === "heights")
            throw new Error("End does not support heights mode");
        return Xu(e, n, r, i, o, s)
    }
    const c = e[t];
    if (c instanceof ht)
        return a.mode === "heights" ? {
            biomes: new Uint8Array(i * o),
            heights: c.getSurfaceArea(n, r, i, o, s, a.getHeightLevelAt, a.surfaceCheckType)
        } : a.mode === "biomes" ? typeof a.getBiomesAt == "number" ? {
            biomes: c.getNoiseBiomeArea(n, a.getBiomesAt >> 2, r, i, 1, o, s),
            heights: null
        } : {
            biomes: c.getNoiseBiomeAreaAtHeightType(n, r, i, o, s, a.getBiomesAt),
            heights: null
        } : c.getNoiseBiomeAreaAtHeightTypeWithSurface(n, r, i, o, s, a.getBiomesAt, a.getHeightLevelAt, a.surfaceCheckType);
    if (c instanceof Wo) {
        if (a.mode === "heights")
            throw new Error("Legacy provider does not support heights mode");
        const l = new Uint8Array(i * o)
          , u = c.getInts(n, r, i * s, o * s);
        for (let d = 0; d < o; d++)
            for (let f = 0; f < i; f++) {
                const _ = d * i + f
                  , p = Math.floor((d + .5) * s) * i * s + Math.floor((f + .5) * s);
                l[_] = u[p]
            }
        return {
            biomes: l,
            heights: null
        }
    }
    if (c instanceof Go) {
        if (a.mode === "heights")
            throw new Error("Single biome provider does not support heights mode");
        const l = new Uint8Array(i * o);
        return l.fill(c.getBiome()),
        {
            biomes: l,
            heights: null
        }
    }
    throw new Error("Unknown biome provider")
}
function Xu(e, t, n, r, i, o) {
    let s = 1;
    if (o < 4) {
        if (o === 2)
            s = 2;
        else if (o === 1)
            s = 4;
        else
            throw new Error("Invalid step");
        if (r % s !== 0 || i % s !== 0)
            throw new Error(`Invalid xLen ${r} or zLen ${i} for step ${o}`)
    }
    if (s === 1)
        return {
            biomes: e[y.End].getBiomeArea(t, n, r, i, o),
            heights: null
        };
    const a = e[y.End].getBiomeArea(t, n, r / s, i / s, o * s)
      , c = new Uint8Array(r * i);
    for (let l = 0; l < i / s; l++)
        for (let u = 0; u < r / s; u++) {
            const d = a[l * r / s + u];
            for (let f = 0; f < s; f++)
                for (let _ = 0; _ < s; _++) {
                    const p = u * s + _
                      , w = l * s + f;
                    c[w * r + p] = d
                }
        }
    return {
        biomes: c,
        heights: null
    }
}
function $u(e, t, n, r) {
    const i = []
      , s = 1 / Math.sqrt(.5) * Math.sqrt(r / 4)
      , a = 45
      , c = 315
      , l = s * 1
      , u = Math.PI * a / 180
      , d = Math.PI * c / 180
      , f = Math.cos(u)
      , _ = Math.sin(u);
    for (let p = 0; p < n; p++) {
        const w = Math.max(p - 1, 0)
          , v = Math.min(p + 1, n - 1);
        for (let T = 0; T < t; T++) {
            const B = Math.max(T - 1, 0)
              , k = Math.min(T + 1, t - 1)
              , A = .025 * e[p * t + B]
              , P = .025 * e[p * t + k]
              , E = .025 * e[w * t + T]
              , I = .025 * e[v * t + T]
              , O = (P - A) / l
              , M = (I - E) / l
              , F = Math.atan(Math.sqrt(O * O + M * M));
            let z = Math.atan2(M, -O);
            z < 0 ? z = Math.PI / 2 - z : z > Math.PI / 2 ? z = 2 * Math.PI - z + Math.PI / 2 : z = Math.PI / 2 - z;
            const H = _ * Math.cos(F) + f * Math.sin(F) * Math.cos(d - z);
            i[p * t + T] = gr(Math.floor(256 * (H - .20710678118654746)), 0, 255)
        }
    }
    return i
}
function qu(e, t, n) {
    return [Math.round(e[0] * (1 - n) + t[0] * n), Math.round(e[1] * (1 - n) + t[1] * n), Math.round(e[2] * (1 - n) + t[2] * n)]
}
function Kn(e, t) {
    const n = e / 256
      , r = t / 256;
    return n < .5 ? gr(Math.floor(2 * n * r * 256), 0, 255) : gr(Math.floor((1 - 2 * (1 - n) * (1 - r)) * 256), 0, 255)
}
function Qu({biome: e, height: t, shadingData: n, biomeFilter: r}) {
    if (e === 255)
        return [0, 0, 0, 0];
    const i = Re[e];
    let o = i.rgb;
    if (t != null && n != null) {
        const a = t < gs
          , c = i.category === "ocean" || i.category === "river"
          , l = i.temperature <= .1;
        a && !c ? l ? o = Re[11].rgb : o = Re[7].rgb : !a && c && (l ? o = Re[26].rgb : o = Re[16].rgb),
        o = [Kn(n, o[0]), Kn(n, o[1]), Kn(n, o[2])]
    }
    const s = [...o, 255];
    if (r)
        if (r.includes(e))
            s[0] = Math.round(o[0] * .6),
            s[1] = Math.round(o[1] * .6),
            s[2] = Math.round(o[2] * .6);
        else {
            const a = qu(Ua, o, .1255);
            s[0] = a[0],
            s[1] = a[1],
            s[2] = a[2]
        }
    return s
}
async function Yu(e, t, n, r) {
    const i = Nt(e)
      , {providers: o} = Wt(i);
    return o[y.Overworld].noise().getNoiseBiomeYColumn(t, n, r)
}
async function ef(e, t, n, r, i, o) {
    const s = {
        x: n,
        z: r,
        sizeX: i,
        sizeZ: o
    }
      , a = Nt(e)
      , {poiFinder: c} = Wt(a);
    return await c(s, t)
}
function tf(e, t, n) {
    if (e.shape.kind === "square") {
        const i = Math.max(1, Math.round(e.shape.inradius * 2))
          , o = i - 1 >> 1;
        return {
            centerX: t,
            centerZ: n,
            minX: t - o,
            maxX: t + (i - 1 - o),
            minZ: n - o,
            maxZ: n + (i - 1 - o)
        }
    }
    const r = e.shape.radius;
    return {
        centerX: t,
        centerZ: n,
        minX: Math.floor(t - r),
        maxX: Math.ceil(t + r),
        minZ: Math.floor(n - r),
        maxZ: Math.ceil(n + r)
    }
}
function nf(e, t, n, r) {
    if (e.shape.kind === "square")
        return n >= t.minX && n <= t.maxX && r >= t.minZ && r <= t.maxZ;
    const i = n - t.centerX
      , o = r - t.centerZ;
    return i * i + o * o <= e.shape.radius * e.shape.radius
}
async function zn(e, t, n, r, i) {
    const o = Math.max(0, (n.minX >> 2) - e.xQ0)
      , s = Math.min(e.xLen, (n.maxX >> 2) - e.xQ0 + 1)
      , a = Math.max(0, (n.minZ >> 2) - e.zQ0)
      , c = Math.min(e.zLen, (n.maxZ >> 2) - e.zQ0 + 1);
    for (let l = a; l < c; l++) {
        await r();
        const u = (e.zQ0 + l) * 4
          , d = u + 2;
        for (let f = o; f < s; f++) {
            const _ = (e.xQ0 + f) * 4
              , p = _ + 2;
            rf(t, n, _, u) && i(l * e.xLen + f, p, d)
        }
    }
}
function rf(e, t, n, r) {
    const i = n + 3
      , o = r + 3;
    if (e.shape.kind === "square")
        return i >= t.minX && n <= t.maxX && o >= t.minZ && r <= t.maxZ;
    const s = Math.max(n, Math.min(t.centerX, i))
      , a = Math.max(r, Math.min(t.centerZ, o))
      , c = s - t.centerX
      , l = a - t.centerZ;
    return c * c + l * l <= e.shape.radius * e.shape.radius
}
function G(e) {
    return e = Math.round(e * 10) / 10,
    (e + "").replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
}
function Ve(e) {
    return e[2].map(function(t) {
        return [e[0], e[1], t]
    })
}
function of(e) {
    const t = e[2];
    return t ? Ve([e[0], e[1], t]) : [[e[0], e[1], void 0]]
}
function $i(e, t) {
    return t.edition === h.Java && t.javaVersion >= m.V1_18 ? [e[0] * 16, null, e[1] * 16] : [e[0] * 16 + 8, null, e[1] * 16 + 8]
}
const L = {
    chunkClassifier: 8,
    veryBig: 16,
    big: 32,
    normal: 128,
    small: 256
}
  , R = {
    chunk: function(e) {
        return e[0] + "//" + e[1]
    },
    xzBlock: function(e, t) {
        return e + "/" + t
    },
    xyBlockArr: function(e) {
        return R.xzBlock(e[2][0], e[2][2])
    }
};
function qi(e) {
    return e.count < 600 ? "small" : e.count < 1800 ? "medium" : e.count < 5400 ? "large" : "huge"
}
function Xn(e) {
    return !!(e && e[0] != null && e[2] != null)
}
function Qi(e) {
    return e ? e === "units" ? "Housing units" : e === "hoglin_stable" ? "Hoglin stables" : e === "treasure" ? "Treasure room" : e === "bridge" ? "Bridges" : null : null
}
function Yi(e) {
    return e === de.ZOMBIE ? "Zombie" : e === de.SKELETON ? "Skeleton" : e === de.SPIDER ? "Spider" : null
}
function eo(e) {
    return [e.isLarge ? "Large," : "Small,", e.type === "warm" ? "Warm" : "Cold", "Ruin", e.clusterSize > 0 && "with Cluster (" + e.clusterSize + " small ruins)"].filter(Boolean).join(" ")
}
function sf(e) {
    return e.oreCount < 6 ? "small" : e.oreCount < 9 ? "medium" : "large"
}
function to(e) {
    if (e.type == null)
        return null;
    let t = {
        desert: "Desert Village",
        plains: "Plains Village",
        savanna: "Savanna Village",
        taiga: "Taiga Village",
        snowy: "Snowy Village"
    }[e.type];
    return e.zombie && (t = "Zombie " + t),
    t
}
const Ee = e => e
  , j = e => e
  , We = {
    [g.AbandonedCamp]: j({
        shortId: "Ab",
        label: "Camp",
        fullLabel: "Abandoned Camp",
        icon: "abandoned-camp",
        imgSrc: {
            default: "abandoned-camp.png",
            secretChest: "abandoned-camp-special-copper.png"
        },
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.normal,
        getTooltipText: function(e) {
            return e[2].hasSecretChest ? "Abandoned Camp (Copper Chest)" : "Abandoned Camp"
        },
        getImg: function(e) {
            return e.hasSecretChest ? "secretChest" : "default"
        },
        getCoords: function(e) {
            const {x: t, y: n, z: r} = e[2];
            return [t, n, r]
        },
        fillColor: "154,63,53",
        getHash: R.chunk
    }),
    [g.AmethystGeode]: Ee({
        shortId: "Ag",
        label: "Geode",
        fullLabel: "Amethyst Geode",
        icon: "amethyst",
        imgSrc: "amethyst.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.chunkClassifier,
        splitPois: Ve,
        getHoverText: function(e) {
            return "Likely Geode @ " + e[2].map(function(n) {
                return G(n[0]) + " / " + G(n[1]) + " / " + G(n[2])
            }).join(", ")
        },
        getTooltipText: function() {
            return "Likely Amethyst Geode"
        },
        getCoords: function(e) {
            return e[2]
        },
        fillColor: "98,69,149",
        getHash: R.xyBlockArr
    }),
    [g.AncientCity]: j({
        shortId: "Ac",
        label: "Ancient City",
        icon: "ancient-city",
        imgSrc: "ancient-city.png",
        dimension: y.Overworld,
        biomeScanHeights: ["bottom"],
        maxTileSize: L.normal,
        getTooltipText: function() {
            return "Ancient City"
        },
        getCoords: function(e) {
            return [e[0] * 16 + 8, -51, e[1] * 16 + 8]
        },
        getHoverText: function(e, t) {
            const n = We[g.AncientCity].getCoords?.(e, t) ?? [0, 0, 0];
            return "Ancient City @ " + G(n[0]) + " / " + n[1] + " / " + G(n[2])
        },
        fillColor: "5,35,30",
        getHash: R.chunk
    }),
    [g.BastionRemnant]: j({
        shortId: "Br",
        label: "Bastion",
        fullLabel: "Bastion Remnant",
        icon: "piglin",
        imgSrc: {
            default: "bastion.png",
            bridge: "bastion-bridge.png",
            stables: "bastion-stables.png",
            units: "bastion-units.png",
            treasure: "bastion-treasure.png"
        },
        dimension: y.Nether,
        maxTileSize: L.big,
        getCoords: function(e) {
            return [e[0] * 16, null, e[1] * 16]
        },
        getHoverText: function(e) {
            const t = Qi(e[2].type);
            return t == null ? null : "Type: " + t
        },
        getTooltipText: function(e) {
            return "Bastion (" + Qi(e[2].type) + ")"
        },
        getImg: function(e) {
            return e.type === "hoglin_stable" ? "stables" : e.type === "treasure" ? "treasure" : e.type === "bridge" ? "bridge" : "units"
        },
        fillColor: function(e) {
            return e?.type == null || e.type === "units" ? "140,140,140" : e.type === "hoglin_stable" ? "245,0,122" : e.type === "treasure" ? "139,69,19" : e.type === "bridge" ? "8,145,17" : "0,0,0"
        },
        getHash: R.chunk
    }),
    [g.BuriedTreasure]: j({
        shortId: "Bt",
        label: "Treasure",
        fullLabel: "Buried Treasure",
        icon: "buried-treasure",
        imgSrc: "buried-treasure.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.big,
        getHoverText: function(e, t) {
            const n = We[g.BuriedTreasure].getCoords?.(e, t) ?? [0, 0, 0];
            return "Treasure @ " + G(n[0]) + " / " + G(n[2])
        },
        getTooltipText: function() {
            return "Buried Treasure"
        },
        getCoords: function(e, t) {
            const n = t.edition === h.Java ? 9 : 8;
            return [e[0] * 16 + n, null, e[1] * 16 + n]
        },
        fillColor: "190,140,100",
        getHash: R.chunk
    }),
    [g.Cave]: Ee({
        shortId: "Ca",
        label: "Cave",
        fullLabel: "Cheese Cave",
        icon: "cave",
        imgSrc: {
            default: "cave.png",
            special: "cave-special.png"
        },
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.veryBig,
        splitPois: Ve,
        getCoords: function(e) {
            return e[2].reference.pos
        },
        getTooltipText: function(e) {
            return "Cheese Cave (" + qi(e[2]) + ")"
        },
        getImg: function(e) {
            return qi(e) === "huge" ? "special" : "default"
        },
        fillColor: function() {
            return "80,80,80"
        },
        getHash: function(e) {
            return R.xzBlock(e[2].reference.pos[0], e[2].reference.pos[2])
        }
    }),
    [g.DesertTemple]: j({
        shortId: "Dt",
        label: "Desert Temple",
        icon: "desert-temple",
        imgSrc: "desert-temple.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.normal,
        getTooltipText: function(e, t) {
            return t.edition === h.Java && t.javaVersion >= m.V1_18 ? "Likely Desert Temple" : "Desert Temple"
        },
        fillColor: "120,100,20",
        getHash: R.chunk
    }),
    [g.DesertWell]: j({
        shortId: "Dw",
        label: "Desert Well",
        icon: "desert-well",
        imgSrc: "desert-well.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.big,
        getTooltipText: function(e) {
            return "Likely Desert Well"
        },
        getCoords: function(e) {
            return e[2].slice(0, 3)
        },
        fillColor: "40,57,161",
        getHash: R.chunk
    }),
    [g.Dungeon]: Ee({
        shortId: "D",
        label: "Dungeon",
        icon: "dungeon",
        imgSrc: {
            default: "dungeon.png",
            zombie: "dungeon-zombie.png",
            spider: "dungeon-spider.png",
            skeleton: "dungeon-skeleton.png"
        },
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.chunkClassifier,
        getImg: function(e) {
            const t = e[3];
            return t === de.ZOMBIE ? "zombie" : t === de.SKELETON ? "skeleton" : "spider"
        },
        fillColor: function(e) {
            return e == null || e.length > 1 ? "220,120,20" : e[0][3] === de.ZOMBIE ? "70,109,29" : e[0][3] === de.SKELETON ? "125,125,125" : e[0][3] === de.SPIDER ? "168,46,0" : "0,0,0"
        },
        splitPois: Ve,
        getCoords: function(e) {
            return e[2].slice(0, 3)
        },
        getTooltipText: function(e, t) {
            const n = Yi(e[2][3]) || "Unknown Mob";
            return (t.edition === h.Bedrock && t.bedrockVersion >= x.V1_18 || t.edition === h.Java && t.javaVersion >= m.V1_18 ? "Possible" : "Likely") + " Dungeon (" + n + ")"
        },
        getHoverText: function(e) {
            return e[2].map(function(t) {
                return (Yi(t[3]) || "Dungeon") + " @ " + [G(t[0]), t[1], G(t[2])].join(" / ")
            }, "").join(", ")
        },
        getHash: function(e) {
            return R.xyBlockArr([e[0], e[1], [e[2][0], e[2][1], e[2][2]]])
        }
    }),
    [g.Fossil]: Ee({
        shortId: "F",
        label: "Fossil",
        icon: "fossil",
        imgSrc: "fossil.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.chunkClassifier,
        fillColor: "90,90,90",
        splitPois: of,
        getCoords: function(e) {
            return Xn(e[2]) ? e[2].slice(0, 3) : [e[0] * 16 + 8, null, e[1] * 16 + 8]
        },
        getTooltipText: function(e) {
            let t = e[2] && e[2][3] === "diamond" ? "Diamond Fossil" : "Fossil";
            return Xn(e[2]) || (t += " (Estimated)"),
            t
        },
        getHoverText: function(e) {
            const t = e[2].filter(Boolean);
            return Xn(t[0]) ? t.map(function(n) {
                return "Fossil @ " + [G(n?.[0] ?? 0), n?.[1], G(n?.[2] ?? 0)].filter(Boolean).join(" / ")
            }, "").join(", ") : null
        },
        getHash: R.chunk
    }),
    [g.FossilNether]: Ee({
        shortId: "Fn",
        label: "Nether Fossil",
        icon: "fossil",
        imgSrc: {
            default: "fossil.png",
            ghast: "fossil-ghast.png"
        },
        dimension: y.Nether,
        maxTileSize: L.chunkClassifier,
        fillColor: function(e) {
            return e != null && e[0][3].hasDriedGhast ? "0,122,108" : "90,90,90"
        },
        splitPois: Ve,
        getImg: function(e) {
            return e[3].hasDriedGhast ? "ghast" : "default"
        },
        getCoords: function(e) {
            return e[2].slice(0, 3)
        },
        getTooltipText: function(e, t) {
            let n;
            return t.edition === h.Bedrock ? n = "Likely Nether Fossil" : n = "Nether Fossil",
            e[2][3].hasDriedGhast && (n += " (Ghast)"),
            n
        },
        getHoverText: function(e) {
            return e[2].map(function(t) {
                return "Fossil " + (t[3].hasDriedGhast ? "(Ghast)" : "") + " @ " + [G(t[0]), t[1], G(t[2])].filter(Boolean).join(" / ")
            }, "").join(", ")
        },
        getHash: R.chunk
    }),
    [g.EndCity]: j({
        shortId: "E",
        label: "End City",
        icon: "end-city",
        imgSrc: {
            default: "end-city.png",
            ship: "end-city-ship.png"
        },
        dimension: y.End,
        maxTileSize: L.normal,
        getImg: function(e) {
            return e.hasShip == null || e.hasShip ? "ship" : "default"
        },
        fillColor: function(e) {
            return e == null || e.hasShip == null || e.hasShip ? "73,49,73" : "130,130,130"
        },
        getTooltipText: function(e) {
            return "Likely " + (e[2].hasShip == null ? "End City" : e[2].hasShip ? "End City (with ship)" : "End City (without ship)")
        },
        getHoverText: function(e) {
            return e[2].hasShip == null ? null : e[2].hasShip ? "End City with ship" : "End City without ship"
        },
        getHash: R.chunk
    }),
    [g.EndGateway]: Ee({
        shortId: "Eg",
        label: "End Gateway",
        icon: "end-gateway",
        imgSrc: "end-gateway.png",
        dimension: y.End,
        maxTileSize: L.normal,
        fillColor: "20,100,85",
        splitPois: Ve,
        getCoords: function(e) {
            return [e[2].x, null, e[2].z]
        },
        getHoverText: function(e) {
            return "End Gateway @ " + G(e[2][0].x) + " / " + G(e[2][0].z)
        },
        getTooltipText: function() {
            return "End Gateway"
        },
        getHash: function(e) {
            return R.xzBlock(e[2].x, e[2].z)
        }
    }),
    [g.NetherFortress]: j({
        shortId: "N",
        label: "Nether Fortress",
        icon: "nether-fortress2",
        imgSrc: "nether-fortress.png",
        dimension: y.Nether,
        maxTileSize: L.big,
        fillColor: "195,65,55",
        getCoords: function(e) {
            return [e[0] * 16 + 11, null, e[1] * 16 + 11]
        },
        getTooltipText: function() {
            return "Nether Fortress (Crossing)"
        },
        getHoverText: function(e) {
            return "Crossing @ " + G((e[0] << 4) + 11) + " / " + G((e[1] << 4) + 11)
        },
        getHash: R.chunk
    }),
    [g.Igloo]: j({
        shortId: "I",
        label: "Igloo",
        icon: "igloo2",
        imgSrc: {
            default: "igloo.png",
            basement: "igloo-basement.png"
        },
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.normal,
        getImg: function(e) {
            return e.hasBasement ? "basement" : "default"
        },
        fillColor: function(e) {
            return e?.hasBasement ? "35,87,205" : "100,100,100"
        },
        getTooltipText: function(e) {
            return e[2].hasBasement == null ? "Igloo" : e[2].hasBasement ? "Igloo (with basement)" : "Igloo (without basement)"
        },
        getHoverText: function(e) {
            return e[2].hasBasement == null ? null : e[2].hasBasement ? "Igloo with basement" : "Igloo without basement"
        },
        getHash: R.chunk
    }),
    [g.JungleTemple]: j({
        shortId: "J",
        label: "Jungle Temple",
        icon: "jungle-temple",
        imgSrc: "jungle-temple.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.normal,
        getTooltipText: function(e, t) {
            return t.edition === h.Java && t.javaVersion >= m.V1_18 ? "Likely Jungle Temple" : "Jungle Temple"
        },
        fillColor: "114,133,10",
        getHash: R.chunk
    }),
    [g.WoodlandMansion]: j({
        shortId: "Ma",
        label: "Mansion",
        fullLabel: "Woodland Mansion",
        icon: "mansion3",
        imgSrc: "mansion.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.small,
        getTooltipText: function(e, t) {
            return t.edition === h.Java && t.javaVersion >= m.V1_18 ? "Likely Woodland Mansion" : "Woodland Mansion"
        },
        fillColor: "160,82,45",
        getHash: R.chunk
    }),
    [g.LavaPool]: Ee({
        shortId: "Lp",
        label: "Lava Pool",
        fullLabel: "Underground Lava Pool",
        icon: "lava",
        imgSrc: {
            default: "lava.png",
            bucket: "lava-bucket.png",
            cave: "lava-cave.png"
        },
        getImg: function(e) {
            return e.type === "undergroundLake" ? "bucket" : "cave"
        },
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.chunkClassifier,
        splitPois: Ve,
        fillColor: "240,90,20",
        getHash: function(e) {
            return R.xzBlock(e[2].pos[0], e[2].pos[2])
        },
        getTooltipText: function(e) {
            return e[2].type === "cave" ? "Lava-Flooded Cave" : "Likely Underground Lava Lake"
        },
        getTooltipAdditionalText: function() {
            return "Never dig straight down"
        },
        getCoords: function(e) {
            return e[2].pos
        }
    }),
    [g.Mineshaft]: j({
        shortId: "M",
        label: "Mineshaft",
        icon: "mineshaft2",
        imgSrc: "mineshaft.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.veryBig,
        getTooltipText: function() {
            return "Mineshaft"
        },
        fillColor: "160,130,10",
        getHash: R.chunk
    }),
    [g.OceanMonument]: j({
        shortId: "Om",
        label: "Monument",
        fullLabel: "Ocean Monument",
        icon: "ocean-monument2",
        imgSrc: "ocean-monument.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.normal,
        getTooltipText: function() {
            return "Ocean Monument"
        },
        fillColor: "100,100,220",
        getHash: R.chunk
    }),
    [g.OceanRuin]: j({
        shortId: "Or",
        label: "Ocean Ruins",
        icon: "ocean-ruin",
        imgSrc: {
            default: "ocean-ruin.png",
            special: "ocean-ruin-special.png"
        },
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.big,
        getImg: function(e) {
            return e.isLarge && e.clusterSize > 0 ? "special" : "default"
        },
        fillColor: function(e) {
            return e?.type === "cold" ? e.isLarge && e.clusterSize > 0 ? "51,102,255" : "80,98,149" : e?.isLarge && e?.clusterSize > 0 ? "255,82,51" : "149,91,80"
        },
        getTooltipText: function(e) {
            return eo(e[2])
        },
        getHoverText: function(e) {
            return eo(e[2])
        },
        getHash: R.chunk
    }),
    [g.PillagerOutpost]: j({
        shortId: "Po",
        label: "Outpost",
        fullLabel: "Pillager Outpost",
        icon: "pillager-outpost2",
        imgSrc: "pillager-outpost.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        getCoords: $i,
        maxTileSize: L.normal,
        getTooltipText: function() {
            return "Pillager Outpost"
        },
        fillColor: "80,50,20",
        getHash: R.chunk
    }),
    [g.Ravine]: Ee({
        shortId: "Rv",
        label: "Ravine",
        icon: "ravine",
        imgSrc: {
            default: "ravine.png",
            special: "ravine-special.png",
            underwater: "ravine-underwater.png",
            underwaterSpecial: "ravine-underwater-special.png"
        },
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.chunkClassifier,
        splitPois: Ve,
        getCoords: function(e) {
            return [e[2].x, e[2].y, e[2].z]
        },
        getImg: function(e) {
            return e.isUnderwater ? e.isMegaRavine ? "underwaterSpecial" : "underwater" : e.isMegaRavine ? "special" : "default"
        },
        getTooltipText: function(e) {
            const t = e[2];
            return [t.isMegaRavine && "Mega", t.isUnderwater && "Underwater", "Ravine", t.thickness && "(Width: " + G(t.thickness) + ")"].filter(Boolean).join(" ")
        },
        getHoverText: function(e) {
            const t = e[2][0];
            return [t.isMegaRavine && "Mega", t.isUnderwater && "Underwater", "Ravine", "@ " + G(t.x) + " / " + G(t.y) + " / " + G(t.z)].filter(Boolean).join(" ")
        },
        fillColor: function(e) {
            if (e == null)
                return "20,90,0";
            const t = e[0];
            return t.isUnderwater ? t.isMegaRavine ? "168,7,213" : "0,0,255" : t.isMegaRavine ? "128,25,0" : "20,90,0"
        },
        getHash: function(e) {
            return R.xzBlock(e[2].x, e[2].z)
        }
    }),
    [g.OreVein]: Ee({
        shortId: "Ov",
        label: "Ore Veins",
        icon: "ore-vein",
        imgSrc: {
            default: "raw-iron.png",
            copper: "raw-copper.png",
            iron: "raw-iron.png"
        },
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        splitPois: Ve,
        getCoords: function(e) {
            return e[2].reference
        },
        getImg: function(e) {
            return e.type
        },
        maxTileSize: L.chunkClassifier,
        getTooltipText: function(e) {
            return [e[2].type === "copper" ? "Copper Vein" : "Iron Vein", "(" + sf(e[2]) + ")"].join(" ")
        },
        fillColor: "110,75,40",
        getHash: function(e) {
            return R.xzBlock(e[2].reference[0], e[2].reference[2])
        }
    }),
    [g.RuinedPortalOverworld]: j({
        shortId: "Rp",
        label: "Ruined Portal",
        fullLabel: "Ruined Portal Overworld",
        icon: "ruined-portal",
        imgSrc: "ruined-portal.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.big,
        getTooltipText: function() {
            return "Estimated Ruined Portal"
        },
        fillColor: "109,9,109",
        getHash: R.chunk
    }),
    [g.RuinedPortalNether]: j({
        shortId: "Rpn",
        label: "Ruined Portal",
        fullLabel: "Ruined Portal Nether",
        icon: "ruined-portal",
        imgSrc: "ruined-portal.png",
        dimension: y.Nether,
        maxTileSize: L.big,
        getTooltipText: function() {
            return "Estimated Ruined Portal"
        },
        fillColor: "109,9,109",
        getHash: R.chunk
    }),
    [g.Shipwreck]: j({
        shortId: "Sw",
        label: "Shipwreck",
        icon: "shipwreck2",
        imgSrc: "shipwreck.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.big,
        getTooltipText: function() {
            return "Shipwreck"
        },
        fillColor: "108,88,97",
        getHash: R.chunk
    }),
    [g.SlimeChunk]: j({
        shortId: "Sc",
        label: "Slime Chunk",
        icon: "slime",
        imgSrc: "slime.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.chunkClassifier,
        getTooltipText: function() {
            return "Slime Chunk"
        },
        fillColor: "29,145,44",
        fillColorOuter: "40,199,60",
        getHash: R.chunk,
        canOverlay: !0,
        preferFill: !0
    }),
    [g.Spawn]: j({
        shortId: "Sp",
        label: "Spawn Point",
        icon: "spawn",
        imgSrc: "spawn.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.small,
        getCoords: function(e) {
            return [e[2].x, null, e[2].z]
        },
        getTooltipText: function() {
            return "Estimated Spawn Point"
        },
        fillColor: "40,40,40",
        getHash: R.chunk
    }),
    [g.Stronghold]: j({
        shortId: "St",
        label: "Stronghold",
        icon: "stronghold",
        imgSrc: "stronghold.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.small,
        fillColor: "195,65,55",
        getCoords: function(e) {
            return [e[0] * 16 + 4, null, e[1] * 16 + 4]
        },
        getTooltipText: function() {
            return "Stronghold (Stairway)"
        },
        getHoverText: function(e) {
            return "Stronghold stairway @ " + G((e[0] << 4) + 4) + " / " + G((e[1] << 4) + 4)
        },
        getHash: R.chunk
    }),
    [g.TrailRuin]: j({
        shortId: "Tr",
        label: "Trail Ruins",
        icon: "trail-ruin",
        imgSrc: "trail-ruin.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground"],
        maxTileSize: L.normal,
        getTooltipText: function(e) {
            return "Trail Ruins"
        },
        getCoords: function(e) {
            return e[2].slice(0, 3)
        },
        fillColor: "123,80,20",
        getHash: R.chunk
    }),
    [g.TrialChamber]: j({
        shortId: "Tc",
        label: "Trial Chamber",
        icon: "trial-chamber",
        imgSrc: "trial-chamber.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface", "underground", "bottom"],
        maxTileSize: L.big,
        getTooltipText: function() {
            return "Trial Chamber"
        },
        getCoords: function(e) {
            return e[2] != null ? e[2] : [e[0] * 16, null, e[1] * 16]
        },
        fillColor: "113,45,25",
        getHash: R.chunk
    }),
    [g.Village]: j({
        shortId: "V",
        label: "Village",
        icon: "village2",
        imgSrc: {
            default: "village.png",
            zombie: "village-zombie.png"
        },
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.normal,
        getImg: function(e) {
            return e.zombie ? "zombie" : "default"
        },
        getCoords: $i,
        fillColor: function(e) {
            return e?.zombie ? "200,0,190" : e?.type == null ? "179,163,60" : {
                desert: "180,101,4",
                plains: "100,131,63",
                savanna: "138,128,56",
                taiga: "11,102,89",
                snowy: "120,120,120"
            }[e.type]
        },
        getTooltipText: function(e) {
            return to(e[2]) || "Village"
        },
        getHoverText: function(e) {
            return to(e[2])
        },
        getHash: R.chunk
    }),
    [g.WitchHut]: j({
        shortId: "Wh",
        label: "Witch Hut",
        icon: "witch-hut2",
        imgSrc: "witch-hut.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.normal,
        getTooltipText: function() {
            return "Witch Hut"
        },
        fillColor: "169,44,212",
        getHash: R.chunk
    }),
    [g.ItemOverworld]: j({
        shortId: "IOw",
        label: "Apple",
        fullLabel: "Enchanted Golden Apple",
        icon: "golden-apple",
        imgSrc: "golden-apple.png",
        dimension: y.Overworld,
        biomeScanHeights: ["surface"],
        maxTileSize: L.small,
        fillColor: "145,81,13",
        getTooltipText: function() {
            return "Likely Enchanted Apple (temple chest)"
        },
        getHoverText: function() {
            return "Likely Enchanted Apple (temple chest)"
        },
        getHash: R.chunk,
        canOverlay: !0
    })
};
Object.fromEntries(Object.entries(We).map(e => [e[1].shortId, e[0]]));
function af(e, t) {
    return `${e}/${We[e].getHash(t)}`
}
const cf = [g.Spawn, g.SlimeChunk, g.Village, g.AncientCity, g.Dungeon, g.Stronghold, g.WoodlandMansion, g.OceanMonument, g.PillagerOutpost, g.Mineshaft, g.RuinedPortalOverworld, g.JungleTemple, g.DesertTemple, g.WitchHut, g.BuriedTreasure, g.Shipwreck, g.Igloo, g.OceanRuin, g.Fossil, g.Cave, g.Ravine, g.LavaPool, g.EndCity, g.EndGateway, g.NetherFortress, g.BastionRemnant, g.RuinedPortalNether, g.AmethystGeode, g.ItemOverworld, g.OreVein, g.DesertWell, g.TrailRuin, g.TrialChamber, g.FossilNether, g.AbandonedCamp];
cf.map(e => ({
    key: e,
    ...We[e]
}));
function lf(e, t, n) {
    return We[e].getCoords?.(t, n) ?? [t[0] * 16 + 8, null, t[1] * 16 + 8]
}
function uf(e, t, n) {
    return {
        coords: lf(e, t, n),
        data: t[2],
        chunk: [t[0], t[1]],
        poiId: af(e, t)
    }
}
function ff(e, t, n) {
    const r = We[e]
      , i = [];
    for (const o of t) {
        const s = r.splitPois ? r.splitPois(o) : [o];
        for (const a of s)
            i.push(uf(e, a, n))
    }
    return i
}
const df = {
    [g.BastionRemnant]: fe()({
        Bridge: e => e.type === "bridge",
        Stables: e => e.type === "hoglin_stable",
        Units: e => e.type === "units",
        Treasure: e => e.type === "treasure"
    }),
    [g.BuriedTreasure]: {},
    [g.Dungeon]: fe()({
        Zombie: e => e[3] === de.ZOMBIE,
        Skeleton: e => e[3] === de.SKELETON,
        Spider: e => e[3] === de.SPIDER
    }),
    [g.EndCity]: fe()({
        Ship: e => e.hasShip
    }),
    [g.NetherFortress]: {},
    [g.SlimeChunk]: {},
    [g.Stronghold]: {},
    [g.Village]: fe()({
        Zombie: e => !!e.zombie,
        Desert: e => e.type === "desert",
        Plains: e => e.type === "plains",
        Savanna: e => e.type === "savanna",
        Taiga: e => e.type === "taiga",
        Snowy: e => e.type === "snowy"
    }),
    [g.Mineshaft]: {},
    [g.WoodlandMansion]: {},
    [g.PillagerOutpost]: {},
    [g.OceanRuin]: fe()({
        Large: e => e.isLarge,
        Cluster: e => e.clusterSize > 0,
        Warm: e => e.type === "warm",
        Cold: e => e.type === "cold"
    }),
    [g.OceanMonument]: {},
    [g.Shipwreck]: {},
    [g.DesertTemple]: {},
    [g.JungleTemple]: {},
    [g.WitchHut]: {},
    [g.Igloo]: fe()({
        Basement: e => !!e.hasBasement
    }),
    [g.RuinedPortalOverworld]: {},
    [g.RuinedPortalNether]: {},
    [g.Spawn]: {},
    [g.Fossil]: fe()({
        Diamond: e => e[3] === "diamond",
        Coal: e => e[3] === "coal"
    }),
    [g.FossilNether]: fe()({
        Ghast: e => !!e[3].hasDriedGhast
    }),
    [g.Ravine]: fe()({
        Mega: e => e.isMegaRavine,
        Underwater: e => e.isUnderwater
    }),
    [g.EndGateway]: {},
    [g.AmethystGeode]: {},
    [g.AncientCity]: {},
    [g.ItemOverworld]: {},
    [g.OreVein]: fe()({
        Copper: e => e.type === "copper",
        Iron: e => e.type === "iron",
        Small: e => $n(e) === "small",
        Medium: e => $n(e) === "medium",
        Large: e => $n(e) === "large"
    }),
    [g.Cave]: fe()({
        Small: e => Qt(e) === "small",
        Medium: e => Qt(e) === "medium",
        Large: e => Qt(e) === "large",
        Huge: e => Qt(e) === "huge"
    }),
    [g.DesertWell]: {},
    [g.TrailRuin]: {},
    [g.TrialChamber]: {},
    [g.LavaPool]: fe()({
        UndergroundLake: e => e.type === "undergroundLake",
        Cave: e => e.type === "cave"
    }),
    [g.AbandonedCamp]: fe()({
        CopperChest: e => e.hasSecretChest
    })
};
function fe() {
    return e => e
}
function gf(e, t) {
    const n = df[e];
    if (!n)
        throw new Error(`No tags defined for POI: ${e}`);
    return Object.entries(n).filter( ([r,i]) => i(t)).map( ([r]) => r)
}
const _f = ({tags: e, include: t=[], exclude: n=[], includeAny: r=[]}) => !n.some(i => e.includes(i)) && t.every(i => e.includes(i)) && (r.length === 0 || r.some(i => e.includes(i)));
function $n(e) {
    return e.oreCount < 6 ? "small" : e.oreCount < 9 ? "medium" : "large"
}
function Qt(e) {
    return e.count < 600 ? "small" : e.count < 1800 ? "medium" : e.count < 5400 ? "large" : "huge"
}
const mf = {
    [g.BastionRemnant]: {
        units: {
            include: ["Units"],
            label: "Bastion (Housing Units)",
            imgSrcKey: "units"
        },
        stables: {
            include: ["Stables"],
            label: "Bastion (Hoglin Stables)",
            imgSrcKey: "stables"
        },
        treasure: {
            include: ["Treasure"],
            label: "Bastion (Treasure Room)",
            imgSrcKey: "treasure"
        },
        bridge: {
            include: ["Bridge"],
            label: "Bastion (Bridge)",
            imgSrcKey: "bridge"
        }
    },
    [g.Cave]: {
        small: {
            include: ["Small"],
            label: "Small Cheese Cave"
        },
        mediumPlus: {
            includeAny: ["Medium", "Large", "Huge"],
            label: "Medium+ Cheese Cave"
        },
        largePlus: {
            includeAny: ["Large", "Huge"],
            label: "Large+ Cheese Cave"
        },
        huge: {
            include: ["Huge"],
            label: "Huge Cheese Cave",
            imgSrcKey: "special"
        }
    },
    [g.Dungeon]: {
        zombie: {
            include: ["Zombie"],
            label: "Zombie Dungeon",
            imgSrcKey: "zombie"
        },
        skeleton: {
            include: ["Skeleton"],
            label: "Skeleton Dungeon",
            imgSrcKey: "skeleton"
        },
        spider: {
            include: ["Spider"],
            label: "Spider Dungeon",
            imgSrcKey: "spider"
        }
    },
    [g.EndCity]: {
        ship: {
            include: ["Ship"],
            label: "End City with Ship",
            imgSrcKey: "ship"
        },
        "no-ship": {
            exclude: ["Ship"],
            label: "End City without Ship"
        }
    },
    [g.Fossil]: {
        diamond: {
            include: ["Diamond"],
            label: "Diamond Fossil"
        },
        coal: {
            include: ["Coal"],
            label: "Coal Fossil"
        }
    },
    [g.FossilNether]: {
        ghast: {
            include: ["Ghast"],
            label: "Nether Fossil (Dried Ghast)",
            imgSrcKey: "ghast"
        }
    },
    [g.Igloo]: {
        basement: {
            include: ["Basement"],
            label: "Igloo With Basement",
            imgSrcKey: "basement"
        },
        "no-basement": {
            exclude: ["Basement"],
            label: "Igloo Without Basement"
        }
    },
    [g.LavaPool]: {
        lake: {
            include: ["UndergroundLake"],
            label: "Underground Lava Lake",
            imgSrcKey: "bucket"
        },
        cave: {
            include: ["Cave"],
            label: "Lava-Flooded Cave",
            imgSrcKey: "cave"
        }
    },
    [g.OceanRuin]: {
        large: {
            include: ["Large"],
            label: "Large Ocean Ruins"
        },
        small: {
            exclude: ["Large"],
            label: "Small Ocean Ruins"
        },
        cluster: {
            include: ["Cluster"],
            label: "Ocean Ruins with Cluster",
            imgSrcKey: "special"
        },
        warm: {
            include: ["Warm"],
            label: "Warm Ocean Ruins"
        },
        cold: {
            include: ["Cold"],
            label: "Cold Ocean Ruins"
        }
    },
    [g.OreVein]: {
        copper: {
            include: ["Copper"],
            label: "Copper Vein",
            imgSrcKey: "copper"
        },
        iron: {
            include: ["Iron"],
            label: "Iron Vein",
            imgSrcKey: "iron"
        },
        small: {
            include: ["Small"],
            label: "Small Vein"
        },
        mediumPlus: {
            includeAny: ["Medium", "Large"],
            label: "Medium+ Vein"
        },
        large: {
            includeAny: ["Large"],
            label: "Large Vein"
        }
    },
    [g.Ravine]: {
        mega: {
            include: ["Mega"],
            label: "Mega Ravine",
            imgSrcKey: "special"
        },
        underwater: {
            include: ["Underwater"],
            label: "Underwater Ravine",
            imgSrcKey: "underwater"
        }
    },
    [g.Village]: {
        zombie: {
            include: ["Zombie"],
            label: "Zombie Village",
            imgSrcKey: "zombie"
        },
        desert: {
            include: ["Desert"],
            label: "Desert Village"
        },
        plains: {
            include: ["Plains"],
            label: "Plains Village"
        },
        savanna: {
            include: ["Savanna"],
            label: "Savanna Village"
        },
        taiga: {
            include: ["Taiga"],
            label: "Taiga Village"
        }
    },
    [g.AbandonedCamp]: {
        copperChest: {
            include: ["CopperChest"],
            label: "Camp (Copper Chest)",
            imgSrcKey: "secretChest"
        }
    }
};
function hf(e, t) {
    if (!t)
        return {};
    const n = mf[e]?.[t];
    return n ? {
        includeTags: n.include,
        includeAnyTags: n.includeAny,
        excludeTags: n.exclude
    } : {}
}
function pf(e, t) {
    const {includeTags: n, includeAnyTags: r, excludeTags: i} = hf(e, t);
    return (o, s) => {
        if (e !== o)
            return !1;
        const a = gf(o, s);
        return _f({
            tags: a,
            include: n,
            exclude: i,
            includeAny: r
        })
    }
}
const _s = 1e-9;
function ms(e, t, n) {
    const r = e[0] - t[0]
      , i = e[2] - t[2]
      , o = n && e[1] != null && t[1] != null ? e[1] - t[1] : 0;
    return r * r + o * o + i * i
}
function Zr(e) {
    return Math.max(1, Math.abs(e)) * _s
}
function $(e, t) {
    return Math.floor(e / t)
}
function yf(e, t, n, r) {
    const i = n[0] - t[0]
      , o = n[2] - t[2]
      , s = i * i + o * o;
    if (s === 0 || s > 4 * r)
        return;
    const a = (t[0] + n[0]) / 2
      , c = (t[2] + n[2]) / 2
      , l = r - s / 4;
    if (l <= 0) {
        e.push([a, null, c]);
        return
    }
    const u = Math.sqrt(l / s)
      , d = -o * u
      , f = i * u;
    e.push([a + d, null, c + f], [a - d, null, c - f])
}
function bf(e, t, n, r, i) {
    const o = t[1]
      , s = n[0] - t[0]
      , a = n[1] - o
      , c = n[2] - t[2]
      , l = r[0] - t[0]
      , u = r[1] - o
      , d = r[2] - t[2]
      , f = s * s + a * a + c * c
      , _ = l * l + u * u + d * d
      , p = s * l + a * u + c * d
      , w = f * _ - p * p;
    if (w < 1e-9)
        return;
    const v = (f / 2 * _ - _ / 2 * p) / w
      , T = (f * (_ / 2) - p * (f / 2)) / w
      , B = t[0] + v * s + T * l
      , k = o + v * a + T * u
      , A = t[2] + v * c + T * d
      , P = (B - t[0]) * (B - t[0]) + (k - o) * (k - o) + (A - t[2]) * (A - t[2])
      , E = i - P;
    if (E < 0)
        return;
    if (E === 0) {
        e.push([B, k, A]);
        return
    }
    const I = a * d - c * u
      , O = c * l - s * d
      , M = s * u - a * l
      , F = Math.sqrt(E / w);
    e.push([B + I * F, k + O * F, A + M * F], [B - I * F, k - O * F, A - M * F])
}
async function hs(e, t, n) {
    const r = e.get(t);
    if (r !== void 0 || e.has(t))
        return r;
    const i = Promise.resolve(n());
    e.set(t, i);
    try {
        const o = await i;
        return e.set(t, o),
        o
    } catch (o) {
        throw e.delete(t),
        o
    }
}
const Pe = 4;
async function Kr(e, t, n, r, i=we) {
    const o = [...new Set(n)]
      , s = $(r.minX >> 4, Pe)
      , a = $(r.minZ >> 4, Pe)
      , c = $(r.maxX >> 4, Pe)
      , l = $(r.maxZ >> 4, Pe)
      , u = {};
    for (const d of o) {
        const f = [];
        for (let _ = a; _ <= l; _++)
            for (let p = s; p <= c; p++) {
                await i();
                const w = `poi-tile:${d}:${p},${_}`
                  , v = await hs(e, w, async () => (await t({
                    x: p * Pe,
                    z: _ * Pe,
                    sizeX: Pe,
                    sizeZ: Pe
                }, [d]))[d] ?? []);
                v.length > 0 && f.push(v)
            }
        u[d] = f.flat()
    }
    return u
}
async function wf(e, t, n, r, i, o, s, a=we) {
    const c = r * 16
      , l = i * 16
      , u = (r + o) * 16 - 1
      , d = (i + s) * 16 - 1;
    return Kr(e, t, n, {
        minX: c,
        maxX: u,
        minZ: l,
        maxZ: d
    }, a)
}
function ps(e, t) {
    return e < t ? -1 : e > t ? 1 : 0
}
function ys(e, t, n, r) {
    const i = pf(e, t);
    return ff(e, n, r).filter(o => i(e, o.data))
}
function bs(e, t, n, r, i, o) {
    return ys(e, t, n, r).filter(s => nf(i, o, s.coords[0], s.coords[2]))
}
function vf(e) {
    const t = new Set
      , n = [];
    for (const r of [...e].sort( (i, o) => ps(i.poiId, o.poiId)))
        t.has(r.poiId) || (t.add(r.poiId),
        n.push(r));
    return n
}
const K = 16;
function xf(e) {
    return e.mode === "biomes" ? ["biomes", e.getBiomesAt].join(":") : e.mode === "heights" ? ["heights", e.getHeightLevelAt, e.surfaceCheckType].join(":") : ["biomesAndHeights", e.getBiomesAt, e.getHeightLevelAt, e.surfaceCheckType].join(":")
}
async function Ln(e, t, n, r, i, o=we) {
    const s = $(r.minX >> 2, K)
      , a = $(r.minZ >> 2, K)
      , c = $(r.maxX >> 2, K)
      , l = $(r.maxZ >> 2, K)
      , u = c - s + 1
      , d = l - a + 1
      , f = s * K
      , _ = a * K
      , p = u * K
      , w = d * K
      , v = `biome-tile:${n}:${xf(i)}`
      , T = [];
    for (let E = a; E <= l; E++)
        for (let I = s; I <= c; I++) {
            const O = `${v}:${I},${E}`;
            await o(),
            T.push(hs(e, O, () => Mt(t, n, I * K, E * K, K, K, 1, i)))
        }
    const B = await Promise.all(T)
      , k = new Uint8Array(p * w)
      , A = i.mode !== "biomes" ? new Int32Array(p * w) : null;
    let P = !1;
    for (let E = 0; E < d; E++)
        for (let I = 0; I < u; I++) {
            const O = B[E * u + I];
            for (let M = 0; M < K; M++) {
                const F = (E * K + M) * p + I * K
                  , z = M * K;
                for (let H = 0; H < K; H++)
                    k[F + H] = O.biomes[z + H];
                if (A)
                    if (O.heights)
                        for (let H = 0; H < K; H++)
                            A[F + H] = O.heights[z + H];
                    else
                        P = !0
            }
        }
    return {
        biomes: k,
        heights: P ? null : A,
        xQ0: f,
        zQ0: _,
        xLen: p,
        zLen: w
    }
}
const Sr = ["depth0", "bottom", "caveDepth"];
function Xr(e, t) {
    return t === y.Overworld ? Hr(e) ? Sr : ["depth0"] : t === y.Nether ? jo(e) ? Sr : ["depth0"] : ["depth0"]
}
function Sf(e) {
    switch (e.kind) {
    case "surface":
        return {
            mode: "biomes",
            getBiomesAt: "depth0"
        };
    case "underground":
        return {
            mode: "biomes",
            getBiomesAt: "caveDepth"
        };
    case "fixed":
        return {
            mode: "biomes",
            getBiomesAt: e.y
        }
    }
}
function ws(e) {
    return {
        mode: "biomes",
        getBiomesAt: e
    }
}
function Cf(e) {
    return Sr.includes(e)
}
function no(e, t, n, r, i) {
    const {biomes: o} = Mt(e, t, n >> 2, r >> 2, 1, 1, 1, {
        mode: "biomes",
        getBiomesAt: i
    });
    return o[0]
}
async function Tf(e, t, n, r, i, o, s, a, c, l, u=we) {
    const d = await Kr(l, t, [s.type], o, u)
      , f = []
      , _ = bs(s.type, s.variantId, d[s.type] ?? [], n, i, o);
    if (_.length < a)
        return {
            passed: !1,
            witnessPoiIds: [],
            poiIds: []
        };
    if (_.sort( (p, w) => ps(p.poiId, w.poiId)),
    c !== void 0) {
        const p = Math.max(a, ro);
        for (const w of _)
            if (await u(),
            vs(e, n, r, s.type, w.coords, [c]) && (f.push(w.poiId),
            f.length >= p))
                break
    } else
        for (const p of _)
            f.push(p.poiId);
    return f.length < a ? {
        passed: !1,
        witnessPoiIds: [],
        poiIds: []
    } : {
        passed: !0,
        witnessPoiIds: f.slice(0, a),
        poiIds: f.slice(0, ro)
    }
}
const ro = 100
  , Bf = {
    surface: "depth0",
    underground: "caveDepth",
    bottom: "bottom"
};
function vs(e, t, n, r, i, o) {
    const [s,a,c] = i;
    if (a != null)
        return o.includes(no(e, n, s, c, a));
    const l = We[r].biomeScanHeights ?? ["surface"];
    let d = Xr(t, n).filter(f => l.some(_ => Bf[_] === f));
    return d.length === 0 && (d = ["depth0"]),
    d.some(f => o.includes(no(e, n, s, c, f)))
}
function Ef(e, t) {
    if (e.length === 0)
        return [0, null, 0];
    const n = e.every(s => s[1] != null)
      , r = t && n ? 3 : 2
      , i = e.map(s => r === 3 ? [s[0], s[1], s[2]] : [s[0], s[2]])
      , o = Vf(i, r);
    return r === 3 ? [o.center[0], o.center[1], o.center[2]] : [o.center[0], null, o.center[1]]
}
function Vf(e, t) {
    return Cr(kf(e), e.length, [], t)
}
function Cr(e, t, n, r) {
    if (t === 0 || n.length === r + 1)
        return If(n, r);
    const i = e[t - 1]
      , o = Cr(e, t - 1, n, r);
    return xs(o, i) ? o : Cr(e, t - 1, [...n, i], r)
}
function kf(e) {
    return [...e].sort( (t, n) => oo(t) - oo(n) || Af(t, n))
}
function If(e, t) {
    if (e.length === 0)
        return {
            center: Array(t).fill(0),
            r2: -1
        };
    let n = null;
    const r = 1 << e.length;
    for (let i = 1; i < r; i++) {
        const o = e.filter( (a, c) => (i & 1 << c) !== 0)
          , s = Of(o, t);
        s && e.every(a => xs(s, a)) && (n = n == null || s.r2 < n.r2 - Zr(n.r2) ? s : n)
    }
    return n ?? {
        center: [...e[0]],
        r2: 0
    }
}
function Of(e, t) {
    if (e.length === 1)
        return {
            center: [...e[0]],
            r2: 0
        };
    const n = e[0]
      , r = e.slice(1).map(c => c.map( (l, u) => l - n[u]))
      , i = r.map(c => r.map(l => 2 * io(c, l)))
      , o = r.map(c => io(c, c))
      , s = Mf(i, o);
    if (!s)
        return null;
    const a = [...n];
    for (let c = 0; c < r.length; c++)
        for (let l = 0; l < t; l++)
            a[l] += s[c] * r[c][l];
    return {
        center: a,
        r2: Ss(a, n)
    }
}
function Mf(e, t) {
    const n = t.length
      , r = e.map( (i, o) => [...i, t[o]]);
    for (let i = 0; i < n; i++) {
        let o = i;
        for (let a = i + 1; a < n; a++)
            Math.abs(r[a][i]) > Math.abs(r[o][i]) && (o = a);
        if (Math.abs(r[o][i]) <= _s)
            return null;
        [r[i],r[o]] = [r[o], r[i]];
        const s = r[i][i];
        for (let a = i; a <= n; a++)
            r[i][a] /= s;
        for (let a = 0; a < n; a++) {
            if (a === i)
                continue;
            const c = r[a][i];
            for (let l = i; l <= n; l++)
                r[a][l] -= c * r[i][l]
        }
    }
    return r.map(i => i[n])
}
function xs(e, t) {
    return e.r2 >= 0 && Ss(e.center, t) <= e.r2 + Zr(e.r2)
}
function Ss(e, t) {
    let n = 0;
    for (let r = 0; r < e.length; r++) {
        const i = e[r] - t[r];
        n += i * i
    }
    return n
}
function io(e, t) {
    let n = 0;
    for (let r = 0; r < e.length; r++)
        n += e[r] * t[r];
    return n
}
function oo(e) {
    let t = 2166136261;
    for (const n of e)
        t = Math.imul(t ^ Math.round(n * 1024), 16777619);
    return t >>> 0
}
function Af(e, t) {
    for (let n = 0; n < e.length; n++)
        if (e[n] !== t[n])
            return e[n] - t[n];
    return e.length - t.length
}
async function Ff(e, t, n, r, i, o, s=we) {
    const a = await Cs(e, t, n, r, i, o, s, 1);
    return a.length > 0 ? {
        passed: !0,
        witnessPoiIds: a[0].witnessPoiIds,
        poiIds: a[0].witnessPoiIds
    } : {
        passed: !1,
        witnessPoiIds: [],
        poiIds: []
    }
}
async function Pf(e, t, n, r, i, o, s, a, c=we) {
    const l = i * 16
      , u = o * 16
      , d = (i + s) * 16 - 1
      , f = (o + a) * 16 - 1
      , _ = Math.max(0, r.radius.meters)
      , p = {
        centerX: (l + d) / 2,
        centerZ: (u + f) / 2,
        minX: Math.floor(l - _),
        maxX: Math.ceil(d + _),
        minZ: Math.floor(u - _),
        maxZ: Math.ceil(f + _)
    }
      , w = {
        shape: {
            kind: "square",
            inradius: (p.maxX - p.minX + 1) / 2
        }
    };
    return (await Cs(t, n, w, p, r, e, c)).filter(T => {
        const B = Math.floor(T.coords[0])
          , k = Math.floor(T.coords[2]);
        return B >= l && B <= d && k >= u && k <= f
    }
    )
}
async function Cs(e, t, n, r, i, o, s, a) {
    if (i.members.length === 0)
        return [];
    const c = i.members.map(E => E.poi.type)
      , l = await Kr(o, e, c, r, s)
      , u = i.members.map(E => bs(E.poi.type, E.poi.variantId, l[E.poi.type] ?? [], t, n, r));
    for (let E = 0; E < i.members.length; E++)
        if (u[E].length < i.members[E].minAmount)
            return [];
    const d = [].concat(...u).map(E => E.coords)
      , {meters: f, threeD: _} = i.radius
      , p = f * f
      , w = _ && d.every(E => E[1] != null)
      , v = (E, I) => ms(E, I, w) <= p + Zr(p)
      , T = [...d];
    let B = 0;
    if (w)
        for (let E = 0; E < d.length; E++) {
            const I = d[E];
            for (let O = E + 1; O < d.length; O++) {
                ++B % 250 === 0 && await s();
                const M = d[O]
                  , F = I[0] - M[0]
                  , z = I[2] - M[2]
                  , H = I[1] - M[1];
                if (F * F + z * z + H * H > 4 * p)
                    continue;
                const Q = (I[1] + M[1]) / 2;
                T.push([(I[0] + M[0]) / 2, Q, (I[2] + M[2]) / 2]);
                for (let U = O + 1; U < d.length; U++) {
                    ++B % 250 === 0 && await s();
                    const Y = d[U];
                    bf(T, I, M, Y, p)
                }
            }
        }
    else
        for (let E = 0; E < d.length; E++)
            for (let I = E + 1; I < d.length; I++)
                ++B % 250 === 0 && await s(),
                yf(T, d[E], d[I], p);
    const k = []
      , A = []
      , P = new Set;
    for (const E of T) {
        ++B % 50 === 0 && await s();
        const I = [];
        let O = !0;
        for (let U = 0; U < i.members.length; U++) {
            const Y = i.members[U].minAmount;
            let te = 0;
            for (const W of u[U])
                v(E, W.coords) && (I.push(W),
                te++);
            if (te < Y) {
                O = !1;
                break
            }
        }
        if (!O)
            continue;
        const M = vf(I)
          , F = M.map(U => U.poiId)
          , z = F.join("|");
        if (P.has(z))
            continue;
        P.add(z);
        const H = Rf(M, w)
          , Q = {
            coords: H.coords,
            maxDistance: H.maxDistance,
            witnessPoiIds: F
        };
        if (zf(k, A, Q) && a !== void 0 && k.length >= a)
            return k
    }
    return k
}
function Rf(e, t) {
    const n = Ef(e.map(i => i.coords), t);
    let r = 0;
    for (const i of e)
        r = Math.max(r, ms(i.coords, n, t));
    return {
        coords: n,
        maxDistance: Math.sqrt(r)
    }
}
function zf(e, t, n) {
    const r = new Set(n.witnessPoiIds);
    for (const i of t)
        if (so(r, i))
            return !1;
    for (let i = e.length - 1; i >= 0; i--)
        so(t[i], r) && (e.splice(i, 1),
        t.splice(i, 1));
    return e.push(n),
    t.push(r),
    !0
}
function so(e, t) {
    for (const n of e)
        if (!t.has(n))
            return !1;
    return !0
}
async function Lf(e, t, n, r, i, o, s, a, c=we) {
    const l = Hf(t, n, o, s)
      , u = new Set(s)
      , d = new Set;
    let f = !0;
    for (const _ of l) {
        const p = await Ln(a, e, n, i, ws(_), c);
        switch (await zn(p, r, i, c, w => {
            const v = p.biomes[w];
            u.has(v) ? d.add(v) : o === "limited-to" && (f = !1)
        }
        ),
        o) {
        case "includes-all":
            if (d.size === u.size)
                return !0;
            break;
        case "includes-any":
            if (d.size > 0)
                return !0;
            break;
        case "excludes-all":
            if (d.size > 0)
                return !1;
            break;
        case "limited-to":
            if (!f)
                return !1;
            break
        }
    }
    switch (o) {
    case "includes-all":
        return d.size === u.size;
    case "includes-any":
        return d.size > 0;
    case "excludes-all":
        return d.size === 0;
    case "limited-to":
        return f
    }
}
async function Nf(e, t, n, r, i, o, s, a, c=we) {
    const l = Xr(t, n)
      , u = new Set;
    for (const d of l) {
        const f = await Ln(a, e, n, i, ws(d), c);
        if (await zn(f, r, i, c, _ => {
            u.add(f.biomes[_])
        }
        ),
        u.size > s)
            return o === "at-least"
    }
    switch (o) {
    case "at-least":
        return u.size >= s;
    case "at-most":
        return u.size <= s;
    case "exactly":
        return u.size === s
    }
}
function Hf(e, t, n, r) {
    const i = Xr(e, t);
    if (n !== "includes-all" && n !== "includes-any")
        return i;
    const o = new Set;
    for (const s of r) {
        const a = Va(s);
        Cf(a) && o.add(a)
    }
    return i.filter(s => o.has(s))
}
const Df = .6
  , Wf = 2.25;
function jf(e, t) {
    const n = t.shape.kind === "square" ? t.shape.inradius * 2 : t.shape.radius * 2
      , r = Math.min(Wf, Math.max(Df, Math.sqrt(n / 128)));
    return Math.round(e * r)
}
async function Gf(e, t, n, r, i, o, s, a=we) {
    if (i === void 0 && o === void 0)
        return !0;
    const c = await Ln(s, e, t, r, {
        mode: "heights",
        getHeightLevelAt: "oceanFloor",
        surfaceCheckType: "fastApproximate"
    }, a);
    if (!c.heights)
        return !0;
    const l = [];
    let u = 1 / 0
      , d = -1 / 0;
    if (await zn(c, n, r, a, p => {
        const w = c.heights[p];
        l.push(w),
        w < u && (u = w),
        w > d && (d = w)
    }
    ),
    l.length === 0)
        return !0;
    const f = Ts(l, u, d)
      , _ = u + Tr(f, Math.floor(l.length / 2));
    return !(i !== void 0 && _ < i || o !== void 0 && _ > o)
}
async function Jf(e, t, n, r, i, o, s, a=we) {
    const c = await Ln(s, e, t, r, {
        mode: "heights",
        getHeightLevelAt: "oceanFloor",
        surfaceCheckType: "fastApproximate"
    }, a);
    if (!c.heights)
        return !0;
    const l = []
      , u = new Uint8Array(c.heights.length);
    let d = 1 / 0
      , f = -1 / 0;
    if (await zn(c, n, r, a, O => {
        const M = c.heights[O];
        l.push(M),
        u[O] = 1,
        M < d && (d = M),
        M > f && (f = M)
    }
    ),
    l.length === 0)
        return !0;
    const _ = Ts(l, d, f)
      , p = Math.min(l.length - 1, Math.max(0, Math.floor(i.lowerPercentile / 100 * l.length)))
      , w = Math.min(l.length - 1, Math.max(0, Math.ceil(i.upperPercentile / 100 * l.length) - 1))
      , v = d + Tr(_, p);
    if (d + Tr(_, w) - v > jf(i.maxBlocksAt128, n))
        return !1;
    const B = c.heights
      , k = new Int32Array(f - d + 1);
    let A = 0;
    for (let O = 0; O < c.zLen; O++) {
        await a();
        for (let M = 0; M < c.xLen; M++) {
            const F = O * c.xLen + M;
            u[F] && (M + 1 < c.xLen && u[F + 1] && (k[Math.abs(B[F + 1] - B[F])]++,
            A++),
            O + 1 < c.zLen && u[F + c.xLen] && (k[Math.abs(B[F + c.xLen] - B[F])]++,
            A++))
        }
    }
    if (A === 0)
        return !0;
    const P = Math.max(1, Math.ceil(A * .95));
    let E = 0
      , I = P;
    for (let O = 0; O < k.length && I > 0; O++) {
        const M = Math.min(k[O], I);
        E += O * M,
        I -= M
    }
    return E / 4 / P <= o
}
function Ts(e, t, n) {
    const r = new Int32Array(n - t + 1);
    for (const i of e)
        r[i - t]++;
    return r
}
function Tr(e, t) {
    let n = 0;
    for (let r = 0; r < e.length; r++)
        if (n += e[r],
        n > t)
            return r;
    return e.length - 1
}
async function Uf(e, t, n, r, i, o, s, a, c=we) {
    const l = []
      , u = [];
    for (const d of s) {
        const f = tf(d, i, o);
        for (const _ of d.conditions) {
            const p = await Zf(e, t, n, r, d, f, _, a, c);
            if (!p.passed)
                return {
                    passed: !1,
                    witnessPoiIds: [],
                    poiIds: []
                };
            l.push(...p.witnessPoiIds),
            u.push(...p.poiIds)
        }
    }
    return {
        passed: !0,
        witnessPoiIds: l,
        poiIds: u
    }
}
async function Zf(e, t, n, r, i, o, s, a, c) {
    switch (s.kind) {
    case "poi-presence":
        return Tf(e, t, n, r, i, o, s.poi, s.minAmount, s.biomeAtPos, a, c);
    case "poi-cluster":
        return Ff(t, n, i, o, s, a, c);
    case "biome-filter":
        return {
            passed: await Lf(e, n, r, i, o, s.mode, s.biomes, a, c),
            witnessPoiIds: [],
            poiIds: []
        };
    case "biome-variance":
        return {
            passed: await Nf(e, n, r, i, o, s.comparator, s.count, a, c),
            witnessPoiIds: [],
            poiIds: []
        };
    case "terrain-height":
        return {
            passed: await Gf(e, r, i, o, s.minY, s.maxY, a, c),
            witnessPoiIds: [],
            poiIds: []
        };
    case "flatness":
        return {
            passed: await Jf(e, r, i, o, s.range, s.maxAverageSlope, a, c),
            witnessPoiIds: [],
            poiIds: []
        }
    }
}
const Kf = 400
  , $r = 1
  , oe = 10
  , hn = 4
  , Ce = 4
  , ne = 2
  , Xf = 255;
function qr(e) {
    const t = e * hn;
    if (t % ne !== 0)
        throw new Error(`Biome patch tile quart length ${t} must be divisible by stride ${ne}`);
    return t / ne
}
function pn(e, t, n=1) {
    const r = Math.max($r, t)
      , i = n * Ce;
    return e * i * i >= r
}
function Qr(e, t) {
    const n = e.qStride * Ce;
    return {
        blocks: e.cellCount * n * n,
        exact: t
    }
}
function $f(e, t) {
    return {
        blocks: (e.maxX - e.minX + 1) * (e.maxZ - e.minZ + 1),
        exact: t
    }
}
function qf(e) {
    const t = qr(e);
    return oe * oe * t * t
}
function Bs(e) {
    return {
        minX: e.minQX * Ce,
        maxX: e.maxQX * Ce + e.qStride * Ce - 1,
        minZ: e.minQZ * Ce,
        maxZ: e.maxQZ * Ce + e.qStride * Ce - 1
    }
}
function Es(e) {
    const t = e.qStride * Ce / 2;
    return {
        worldX: Math.round(e.sumQX / e.cellCount * Ce + t),
        worldZ: Math.round(e.sumQZ / e.cellCount * Ce + t)
    }
}
function Vs(e) {
    return {
        worldX: Math.round((e.minX + e.maxX) / 2),
        worldZ: Math.round((e.minZ + e.maxZ) / 2)
    }
}
function ks(e, t) {
    const n = $(e.scanTileX, oe) * oe
      , r = $(e.scanTileZ, oe) * oe
      , i = n * t * 16
      , o = r * t * 16
      , s = oe * t * 16;
    return {
        minX: i,
        maxX: i + s - 1,
        minZ: o,
        maxZ: o + s - 1
    }
}
function Qf(e) {
    const t = new Uint8Array(Math.max(...e) + 1);
    for (const n of e)
        t[n] = 1;
    return t
}
function Yf(e) {
    return e.scanHeight.kind === "surface" && e.scanHeight.surfaceKind === "land"
}
function ed(e, t, n, r, i) {
    return `biome-patch-tile:${_r(e)}:${t.dimension}:${r}:${n}:stride=${ne}:${i}:`
}
function Yr(e, t, n, r, i, o, s, a) {
    const c = a + r + "," + i
      , l = oa(c);
    if (l)
        return l;
    const u = $(r, o)
      , d = $(i, o)
      , f = qr(o)
      , _ = r * hn
      , p = i * hn
      , w = Yf(n.anchor)
      , {biomes: v} = Mt(t, n.dimension, _, p, f, f, ne, Sf(n.anchor.scanHeight));
    let T = !1
      , B = v.length > 0
      , k = f
      , A = -1
      , P = f
      , E = -1;
    for (let O = 0; O < v.length; O++) {
        const M = s[v[O]] === 1;
        if (T = T || M,
        B = B && M,
        w && M) {
            const F = O % f
              , z = Math.floor(O / f);
            F < k && (k = F),
            F > A && (A = F),
            z < P && (P = z),
            z > E && (E = z)
        }
    }
    if (w && T) {
        const O = A - k + 1
          , M = E - P + 1
          , {heights: F} = Mt(t, n.dimension, _ + k * ne, p + P * ne, O, M, ne, {
            mode: "heights",
            getHeightLevelAt: "oceanFloor",
            surfaceCheckType: "fastApproximate"
        });
        if (F) {
            T = !1;
            let z = !1;
            for (let H = 0; H < M; H++)
                for (let Q = 0; Q < O; Q++) {
                    const U = (P + H) * f + (k + Q);
                    s[v[U]] === 1 && (F[H * O + Q] < gs ? (v[U] = Xf,
                    z = !0) : T = !0)
                }
            B = B && !z
        }
    }
    const I = {
        chunkX: r,
        chunkZ: i,
        scanTileX: u,
        scanTileZ: d,
        qX0: _,
        qZ0: p,
        qLen: f,
        qStride: ne,
        biomes: v,
        anyTarget: T,
        allTarget: B
    };
    return sa(c, I),
    I
}
async function td(e, t, n, r, i, o, s, a) {
    const c = $(r.scanTileX, oe) * oe
      , l = $(r.scanTileZ, oe) * oe;
    for (let u = 0; u < oe; u++)
        for (let d = 0; d < oe; d++)
            if (await a(),
            !Yr(e, t, n, (c + d) * i, (l + u) * i, i, o, s).allTarget)
                return !1;
    return !0
}
const nd = 2 ** 26;
function rd(e, t, n, r) {
    const i = e.qLen
      , o = [n];
    let s = 0;
    r[n] = 1;
    let a = 0
      , c = 0
      , l = 0
      , u = 1 / 0
      , d = -1 / 0
      , f = 1 / 0
      , _ = -1 / 0
      , p = !1;
    for (; s < o.length; ) {
        const w = o[s++]
          , v = w % i
          , T = Math.floor(w / i)
          , B = e.qX0 + v * e.qStride
          , k = e.qZ0 + T * e.qStride;
        a++,
        c += B,
        l += k,
        u = Math.min(u, B),
        d = Math.max(d, B),
        f = Math.min(f, k),
        _ = Math.max(_, k),
        p = p || v === 0 || T === 0 || v === i - 1 || T === i - 1;
        for (let A = -1; A <= 1; A++)
            for (let P = -1; P <= 1; P++) {
                if (P === 0 && A === 0)
                    continue;
                const E = v + P
                  , I = T + A;
                E < 0 || E >= i || I < 0 || I >= i || id(o, r, e, t, I * i + E)
            }
    }
    return {
        qStride: e.qStride,
        seedQX: e.qX0 + n % i * e.qStride,
        seedQZ: e.qZ0 + Math.floor(n / i) * e.qStride,
        cellCount: a,
        sumQX: c,
        sumQZ: l,
        minQX: u,
        maxQX: d,
        minQZ: f,
        maxQZ: _,
        touchesEdge: p
    }
}
function id(e, t, n, r, i) {
    t[i] || r[n.biomes[i]] !== 1 || (t[i] = 1,
    e.push(i))
}
async function od(e, t, n, r, i, o, s, a, c, l) {
    const u = qr(r)
      , d = r * hn
      , f = new Map
      , _ = new Set
      , p = []
      , w = [];
    let v = 0
      , T = 0
      , B = 0
      , k = 0
      , A = 1 / 0
      , P = -1 / 0
      , E = 1 / 0
      , I = -1 / 0
      , O = null;
    const M = () => ({
        exceededMaxTiles: !0,
        filledArea: Qr({
            qStride: ne,
            cellCount: O ?? T
        }, !1)
    });
    let F = null
      , z = null
      , H = 0
      , Q = 0;
    const U = (Y, te) => {
        let W = F;
        if (W === null || Y < W.qX0 || Y >= W.qX0 + Q || te < W.qZ0 || te >= W.qZ0 + Q) {
            const ei = $(Y, d)
              , ti = $(te, d);
            W = Yr(e, t, n, ei * r, ti * r, r, i, c),
            F = W,
            Q = W.qLen * W.qStride,
            H = ei * nd + ti,
            z = f.get(H) ?? null
        }
        const ot = Math.floor((Y - W.qX0) / W.qStride)
          , Nn = Math.floor((te - W.qZ0) / W.qStride) * u + ot;
        if (i[W.biomes[Nn]] !== 1)
            return !0;
        let st = z;
        return st === null && (st = new Uint8Array(W.biomes.length),
        f.set(H, st),
        z = st),
        st[Nn] ? !0 : (st[Nn] = 1,
        _.add(H),
        _.size > Kf && pn(T + 1, a, ne) ? (O = T + 1,
        !1) : (p.push(Y),
        w.push(te),
        T++,
        B += Y,
        k += te,
        A = Math.min(A, Y),
        P = Math.max(P, Y),
        E = Math.min(E, te),
        I = Math.max(I, te),
        !0))
    }
    ;
    if (!U(o, s))
        return M();
    for (; v < p.length; ) {
        v % 50 === 0 && await l();
        const Y = p[v]
          , te = w[v];
        v++;
        for (let W = -1; W <= 1; W++)
            for (let ot = -1; ot <= 1; ot++)
                if (!(ot === 0 && W === 0) && !U(Y + ot * ne, te + W * ne))
                    return M()
    }
    return {
        exceededMaxTiles: !1,
        qStride: ne,
        cellCount: T,
        sumQX: B,
        sumQZ: k,
        minQX: A,
        maxQX: P,
        minQZ: E,
        maxQZ: I
    }
}
function Is(e, t, n, r) {
    return ["biome-patch", e.dimension, n, t, "finite", `stride=${r.qStride}`, r.minQX, r.minQZ, r.maxQX, r.maxQZ, r.cellCount].join(":")
}
function Os(e, t, n, r) {
    const i = $(t.scanTileX, oe)
      , o = $(t.scanTileZ, oe);
    return ["biome-patch", e.dimension, r, n, "split", `stride=${ne}`, i, o].join(":")
}
function sd(e) {
    return [...new Set(e)].sort( (t, n) => t - n).join(",")
}
function ad(e) {
    return e.kind === "fixed" ? `fixed:${e.y}` : e.kind === "surface" ? `surface:${e.surfaceKind}` : e.kind
}
async function cd(e, t, n, r, i, o, s, a) {
    const c = n.anchor;
    if (c.biomes.length === 0)
        return [];
    const l = Qf(c.biomes)
      , u = sd(c.biomes)
      , d = ad(c.scanHeight)
      , f = ed(t, n, u, d, o)
      , _ = Yr(s, e, n, r, i, o, l, f);
    if (!_.anyTarget)
        return [];
    const p = []
      , w = c.minPatchSize ?? $r;
    if (_.allTarget && pn(qf(o), w, ne) && await td(s, e, n, _, o, l, f, a)) {
        const T = ks(_, o);
        return [ao(n, {
            dedupeKey: Os(n, _, u, d),
            center: Vs(T),
            bounds: T,
            filledArea: $f(T, !1),
            split: !0
        })]
    }
    const v = new Uint8Array(_.biomes.length);
    for (let T = 0; T < _.biomes.length; T++) {
        if (T % 1e3 === 0 && await a(),
        v[T] || l[_.biomes[T]] !== 1)
            continue;
        const B = rd(_, l, T, v)
          , k = B.touchesEdge ? await ld(s, e, n, _, o, l, u, d, f, B, a) : pn(B.cellCount, w, B.qStride) ? {
            dedupeKey: Is(n, u, d, {
                qStride: B.qStride,
                cellCount: B.cellCount,
                minQX: B.minQX,
                maxQX: B.maxQX,
                minQZ: B.minQZ,
                maxQZ: B.maxQZ
            }),
            center: Es(B),
            bounds: Bs(B),
            filledArea: Qr(B, !0),
            split: !1
        } : null;
        k && p.push(ao(n, k))
    }
    return p
}
async function ld(e, t, n, r, i, o, s, a, c, l, u) {
    const d = n.anchor.minPatchSize ?? $r
      , f = await od(e, t, n, i, o, l.seedQX, l.seedQZ, d, c, u);
    if (f.exceededMaxTiles) {
        const _ = ks(r, i);
        return {
            dedupeKey: Os(n, r, s, a),
            center: Vs(_),
            bounds: _,
            filledArea: f.filledArea,
            split: !0
        }
    }
    return pn(f.cellCount, d, f.qStride) ? {
        dedupeKey: Is(n, s, a, f),
        center: Es(f),
        bounds: Bs(f),
        filledArea: Qr(f, !0),
        split: !1
    } : null
}
function ao(e, t) {
    const {worldX: n, worldZ: r} = t.center;
    return {
        worldX: n,
        worldZ: r,
        chunk: [n >> 4, r >> 4],
        data: {
            type: "biome-patch",
            biomes: e.anchor.biomes,
            scanHeight: e.anchor.scanHeight,
            minPatchSize: e.anchor.minPatchSize,
            bounds: t.bounds,
            filledArea: t.filledArea,
            split: t.split
        },
        dedupeKey: t.dedupeKey,
        anchorPois: [],
        regionPois: []
    }
}
async function ud(e, t, n, r, i, o) {
    let a = 0;
    const c = na(o);
    try {
        const l = Nt(e)
          , {poiFinder: u, providers: d} = Wt(l)
          , f = new Map
          , _ = await fd(d, u, l, t, n, r, i, f, c);
        if (t.regions.length === 0)
            return a = _.length,
            _;
        const p = [];
        for (const w of _) {
            await c();
            const v = await Uf(d, u, l, t.dimension, w.worldX, w.worldZ, t.regions, f, c);
            v.passed && (w.regionPois = v.poiIds,
            p.push(w))
        }
        return a = p.length,
        p
    } catch (l) {
        if (l instanceof fr)
            return [];
        throw l
    }
}
async function fd(e, t, n, r, i, o, s, a, c) {
    switch (r.anchor.kind) {
    case "biome-patch":
        return cd(e, n, r, i, o, s, a, c);
    case "cluster":
        return (await Pf(a, t, n, r.anchor, i, o, s, s, c)).map(u => ({
            worldX: u.coords[0],
            worldY: u.coords[1] ?? void 0,
            worldZ: u.coords[2],
            chunk: [u.coords[0] >> 4, u.coords[2] >> 4],
            data: {
                type: "cluster",
                maxDistance: u.maxDistance
            },
            dedupeKey: `witness:${[...new Set(u.witnessPoiIds)].sort().join("|")}`,
            anchorPois: u.witnessPoiIds,
            regionPois: []
        }));
    case "poi":
        {
            const l = r.anchor.poi
              , d = (await wf(a, t, [l.type], i, o, s, s, c))[l.type]?.filter(_ => _[0] >= i && _[0] < i + s && _[1] >= o && _[1] < o + s);
            if (!d)
                return [];
            const f = [];
            for (const _ of ys(l.type, l.variantId, d, n))
                r.anchor.biomesAtPos !== void 0 && (await c(),
                !vs(e, n, r.dimension, l.type, _.coords, r.anchor.biomesAtPos)) || f.push({
                    worldX: _.coords[0],
                    worldZ: _.coords[2],
                    chunk: _.chunk,
                    data: {
                        type: "poi",
                        poiData: _.data
                    },
                    anchorPois: [_.poiId],
                    regionPois: []
                });
            return f
        }
    }
}
async function dd(e, t) {
    if (t.anchor.kind !== "poi")
        return {
            kind: "unbounded"
        };
    const n = Nt(e)
      , r = t.anchor.poi.type
      , i = ju(r, n);
    if (i === null)
        return {
            kind: "unbounded"
        };
    const {poiFinder: o} = Wt(n)
      , s = (await o(i, [r]))[r] ?? []
      , a = new Set
      , c = [];
    for (const l of s) {
        const u = `${l[0]},${l[1]}`;
        a.has(u) || (a.add(u),
        c.push([l[0], l[1]]))
    }
    return {
        kind: "finite",
        chunks: c
    }
}
function gd(e) {
    ea(e),
    aa()
}
async function _d() {
    await Qs()
}
self.addEventListener("unhandledrejection", e => {
    throw e.reason
}
);
var md = Object.freeze({
    __proto__: null,
    cancelTask: gd,
    getAnchorDomain: dd,
    getBiomeTileData: Ku,
    getNoiseBiomeYColumnOverworld: Yu,
    getPois: ef,
    initWorker: _d,
    scanTile: ud,
    setSharedContextCallback: Ju
});
Br(md);
//# sourceMappingURL=CjlKL4Hg41NT.js.map

//# chunkId=019f3cc0-cba9-7162-92b4-2f1f8d4db8e1
