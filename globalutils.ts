namespace GlobalUtils{

    export class Vect{
        x:number
        y:number

        sin:number
        cos:number

        constructor(_x:number,_y:number){
            this.x = _x
            this.y = _y
        }

        calctrig(r:number,multrby:number=Math.PI){
            this.sin = Math.sin( r * multrby )
            this.cos = Math.cos( r * multrby )
        }

        r(r:number):Vect{this.calctrig(r);return new Vect(
            this.x * this.cos - this.y * this.sin,
            this.x * this.sin + this.y * this.cos
        )}

        n(l:number):Vect{let c = ( l / this.l() );return new Vect(
            this.x * c,
            this.y * c
        )}

        u():Vect{return this.n(1)}

        p(v:Vect):Vect{return new Vect(
            this.x + v.x,
            this.y + v.y
        )}

        m(v:Vect):Vect{return new Vect(
            this.x - v.x,
            this.y - v.y
        )}

        i():Vect{return new Vect(
            -this.x,
            -this.y
        )}

        s(s:number):Vect{return new Vect(
            this.x * s,
            this.y * s
        )}

        l():number{
            return Math.sqrt( this.x * this.x + this.y * this.y )
        }

    }

    let INFINITE_COORD=1E6    

    export class Polygon{
        vects:Vect[]

        shift:Vect
        size:Vect

        constructor(){
            this.vects=[]
        }

        a(v:Vect):Polygon{
            this.vects.push(v)
            return this
        }

        normalize(overwrite:boolean=true):Polygon{
            let minx=INFINITE_COORD
            let miny=INFINITE_COORD
            let maxx=-INFINITE_COORD
            let maxy=-INFINITE_COORD

            this.vects.map(v=>{
                if (v.x < minx) minx = v.x
                if (v.y < miny) miny = v.y
                if (v.x > maxx) maxx = v.x
                if (v.y > maxy) maxy = v.y
            })

            let min = new Vect(minx, miny)
            let max = new Vect(maxx, maxy)

            this.shift = min.i()
            this.size = max.m(min)

            if(overwrite) {this.vects=this.vects.map(v=>
                v.p(this.shift)
            )}

            return this
        }

        // should only be called on a normalized polygon
        reportSvg(bcol:string="#dfdf3f"):string{            
            let points=this.vects.map(v=> ( v.x + "," + v.y ) ).join(" ")
            return `
<svg width="${this.size.x}" height="${this.size.y}" style="position:absolute;top:0px;left:0px;">
<polygon points="${points}" style="fill:${bcol};stroke-width:0px;">
</svg>
`
        }
    }

    export class Arrow{

        svgorig:Vect
        svg:string

        constructor(from:Vect,to:Vect,params:{[id:string]:any}){            
            let widthfactor=params["widthfactor"] || 0.1
            let handlelength=params["handlelength"] || 0.7
            let headfactor=params["headfactor"] || 0.2
            let constantwidth=params["constantwidth"] || 0.0

            let cw = (constantwidth != 0.0)
            let diff = to.m(from)
            let width = cw? constantwidth : diff.l() * widthfactor
            let bottomright = cw? diff.n(constantwidth / 2.0).r(0.5) : diff.n(width / 2.0).r(0.5)
            let bottomleft = bottomright.i()
            let handle = cw? diff.n(diff.l() - 3.0 * constantwidth) : diff.n(diff.l() * handlelength)
            let headfromright = bottomright.p(handle)
            let headfromleft = bottomleft.p(handle)
            let headtoright = headfromright.p(cw? bottomright.s(2.0) : bottomright.n(diff.l() * headfactor))
            let headtoleft = headfromleft.p(cw? bottomleft.s(2.0) : bottomleft.n(diff.l() * headfactor))

            let pg = new Polygon().
                a(bottomright).
                a(headfromright).
                a(headtoright).
                a(diff).
                a(headtoleft).
                a(headfromleft).
                a(bottomleft).
                normalize()

            this.svgorig=to.m(pg.vects[3])
            this.svg=pg.reportSvg(params["color"])
        }

    }

    export class Timer{
        start
        activityname:string
        log:(string)=>void
        constructor(_activityname:string,_log:(string)=>void){
            this.start=performance.now()
            this.activityname=_activityname
            this.log=_log
            _log(_activityname+" started")
        }
        report(){
            let finish=performance.now()
            let elapsed=finish-this.start
            this.log(this.activityname+" took "+elapsed.toLocaleString())
        }
    }

    export class TwoWayMap{
        kvs:{[id:string]:string}

        constructor(_kvs:{[id:string]:string}){
            this.kvs=_kvs
        }

        g(elem:string){
            if(this.kvs[elem]!=undefined) return this.kvs[elem]
            for(let k in this.kvs){
                let v=this.kvs[k]
                if(v==elem) return k
            }
            return null
        }
    }

    export class Logger{
        LOG_MAX=100
        logitems:string[]=[]
        log(item:string){
            this.logitems.push(item)
            if(this.logitems.length>this.LOG_MAX){
                this.logitems=this.logitems.slice(1)
            }                    
        }
    }

    declare class TextEncoder 
    {
        constructor(label?: string, options?: TextEncoding.TextEncoderOptions);
        encoding: string;
        encode(input?: string, options?: TextEncoding.TextEncodeOptions): Uint8Array;
    }
    
    declare class TextDecoder
    {
        constructor(utfLabel?: string, options?: TextEncoding.TextDecoderOptions)
        encoding: string;
        fatal: boolean;
        ignoreBOM: boolean;
        decode(input?: ArrayBufferView, options?: TextEncoding.TextDecodeOptions): string;
    }    

    export class TEnc{
        tenc:TextEncoder
        constructor(label?: string, options?: TextEncoding.TextEncoderOptions){
            this.tenc=new TextEncoder(label,options)
        }
        encode(input?: string, options?: TextEncoding.TextEncodeOptions): Uint8Array{
            return this.tenc.encode(input,options)
        }
    }

    export class TDec{
        tdec:TextDecoder
        constructor(label?: string, options?: TextEncoding.TextDecoderOptions){
            this.tdec=new TextDecoder(label,options)
        }
        decode(input?: ArrayBufferView, options?: TextEncoding.TextDecodeOptions): string{
            return this.tdec.decode(input,options)
        }
    }

    var tdec=new GlobalUtils.TDec()
    var tenc=new GlobalUtils.TEnc()

    ///////////////////////////////////////////////////////
    // from: https://stackoverflow.com/questions/33702838/how-to-append-bytes-multi-bytes-and-buffer-to-arraybuffer-in-javascript
    function concatTypedArrays(a, b) { // a, b TypedArray of same type
        var c = new (a.constructor)(a.length + b.length)
        c.set(a, 0)
        c.set(b, a.length)
        return c
    }
    ///////////////////////////////////////////////////////

    export class MemView{
        view:Uint8Array        
        constructor(_view:Uint8Array){
            this.view=_view
        }
        toString(){
            let term=this.view.indexOf(0)
            if(term<0) return null // not a C terminated string
            return tdec.decode(this.view.slice(0,term))
        }
        strCpy(str:string){
            let view=tenc.encode(str)
            let viewt=concatTypedArrays(view,new Uint8Array([0]))
            this.view.set(viewt)
        }
    }

    export class WasmLoader{
        
        importObject = {
            env: {
                memoryBase: 0,
                tableBase: 0,                
                memory: new WebAssembly.Memory({ initial:256 }),
                table: new WebAssembly.Table({ initial:0, element:'anyfunc' })
            }
        };

        url

        constructor(_url:string,params:{[id:string]:any}){
            this.url=_url
            for(let key in params){                
                let value=params[key]
                this.importObject.env[key]=value
            }
        }

        module
        exports

        env(){return this.importObject.env}
        memory(){return this.env().memory}
        membuff(){return this.memory().buffer}

        memview(from:number,size:number):MemView{            
            return new MemView(new Uint8Array(this.membuff(), from, size))
        }

        fetchThen(callback:()=>void=null){
            fetch(this.url).then(
                response => response.arrayBuffer()
            ).then(
                bytes => WebAssembly.instantiate(bytes, this.importObject)
            ).then(
                results => {
                    this.module=results.instance
                    this.exports=this.module.exports

                    if(callback!=null) callback()
                }
            )
        }

    }

}