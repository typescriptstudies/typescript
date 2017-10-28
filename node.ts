class Document_{
    constructor(){}
    getStyleOfId(id:string):string{
        return document.getElementById(id).style.cssText
    }
    setStyleOfId(id:string,css:string){
        document.getElementById(id).setAttribute("style",css)
    }
    getNode_ById(id:string):Node_{
        let e=document.getElementById(id)
        var n:Node_
        switch(e.tagName){
            case "DIV": n=new Div_();n.n=e;return n
            case "BUTTON": n=new Button_();n.n=e;return n
            case "SELECT": n=new Select_();n.n=e;return n
            case "OPTION": n=new Option_();n.n=e;return n
            case "TEXTAREA": n=new Textarea_();n.n=e;return n
            case "TABLE": n=new Table_();n.n=e;return n
            case "TR": n=new Tr_();n.n=e;return n
            case "TD": n=new Td_();n.n=e;return n
            case "A": n=new A_();n.n=e;return n
            case "BR": n=new A_();n.n=e;return n
            default: return null
        }
    }
}

namespace Node_Globals {
    export let doc=new Document_()
}

//////////////////////////////////////////////////////////

class Node_{

    n:HTMLElement
    id:string
    kind:string

    setId(_id:string):Node_{
        this.n.setAttribute("id",_id)
        return this
    }

    constructor(_id:string="",_kind:string){
        this.id=_id
        this.kind=_kind
        this.n=document.createElement(_kind)
        this.setId(_id)
    }

    // style

    properties:{[id:string]:string}={}    

    reportstyle(){
        let props:string[]=new Array()
        for(let key in this.properties){
            props.push(key+":"+this.properties[key])
        }
        return props.join(";")
    }    

    decomposestyle(css:string):Node_{
        this.properties={}
        let parts=css.split(";")
        for(let i in parts){
            let partnospace=parts[i].replace(new RegExp(" ","g"),"")
            let subparts=partnospace.split(":")            
            if(subparts.length==2){
                let property=subparts[0]
                let value=subparts[1]
                this.properties[property]=value
            }
        }
        return this
    }

    getpx(property:string):number{
        return parseFloat(this.properties[property].replace("px",""))
    }

    s(property:string,value:string):Node_{this.properties[property]=value;return this}
    spx(property:string,value:number):Node_{this.properties[property]=value+"px";return this}
    sspx(property:string,value:number):Node_{this.properties[property]=Config.Scaled(value)+"px";return this}
    swpx(value:number):Node_{this.properties["width"]=value+"px";return this}
    swspx(value:number):Node_{this.properties["width"]=Config.Scaled(value)+"px";return this}
    shpx(value:number):Node_{this.properties["height"]=value+"px";return this}
    shspx(value:number):Node_{this.properties["height"]=Config.Scaled(value)+"px";return this}
    stpx(top:number):Node_{this.properties["top"]=top+"px";return this}
    stspx(top:number):Node_{this.properties["top"]=Config.Scaled(top)+"px";return this}
    slpx(left:number):Node_{this.properties["left"]=left+"px";return this}
    slspx(left:number):Node_{this.properties["left"]=Config.Scaled(left)+"px";return this}
    scol(col:string):Node_{this.properties["color"]=col;return this}
    sbcol(bcol:string):Node_{this.properties["background-color"]=bcol;return this}
    szi(z_index:number):Node_{this.properties["z-index"]=""+z_index;return this}
    spos(position:string):Node_{this.properties["position"]=position;return this}  
    spadpx(padding:number):Node_{this.properties["padding"]=padding+"px";return this}  
    spadspx(padding:number):Node_{this.properties["padding"]=Config.Scaled(padding)+"px";return this}
    sop(opacity:number):Node_{this.properties["opacity"]=""+opacity;return this}
    sburl(url:string):Node_{this.properties["background"]="url("+url+")";return this}
    sovf(ovf:string):Node_{this.properties["overflow"]=ovf;return this}
    sff(ff:string):Node_{this.properties["font-family"]=ff;return this}
    sfspx(fs:number):Node_{this.properties["font-size"]=fs+"px";return this}
    sfsspx(fs:number):Node_{this.properties["font-size"]=Config.Scaled(fs)+"px";return this}
    sv(v:boolean):Node_{this.properties["visibility"]=v?"visible":"hidden";return this}
    scur(cur:string):Node_{this.properties["cursor"]=cur;return this}

    finalize():Node_{
        this.n.setAttribute("style",this.reportstyle())
        return this
    }

    html(html:string):Node_{
        this.n.innerHTML=html
        this.finalize()
        return this
    }

    innerHTML(html:string){
        this.n.innerHTML=html
        return this
    }

    attr(name:string,value):Node_{
        this.n.setAttribute(name,value)
        return this
    }

    appendChild(n_:Node_):Node_{
        this.n.appendChild(n_.n)
        return this
    }

    a(n_:Node_):Node_{
        this.n.appendChild(n_.n)
        return this
    }

    addel(kind:string,handler:(Event)=>void):Node_{
        this.n.addEventListener(kind,handler)
        return this
    }
}

class Div_ extends Node_{
    constructor(id:string=""){
        super(id,"div")        
    }
}

class Button_ extends Node_{
    constructor(caption:string="",handler:(Event)=>void=null){
        super("","input")      
        this.n.setAttribute("type","button")
        this.n.setAttribute("value",caption)
        this.addel("mousedown",handler)  
    }
}

class Option_ extends Node_{
    constructor(key:string="",caption:string="",selected:boolean=false){
        super("","option")
        this.n.setAttribute("id",key)
        this.n.setAttribute("name",key)
        this.n.setAttribute("value",key)
        this.n.innerHTML=caption
        if(selected) {this.n.setAttribute("selected","true")}
    }
}

class Select_ extends Node_{
    constructor(handler:(Event)=>void=null){
        super("","select")
        this.addel("change",handler)  
    }
}

class Textarea_ extends Node_{
    constructor(rows:number=3,cols:number=40){
        super("","textarea")
        this.n.setAttribute("rows",""+rows)
        this.n.setAttribute("cols",""+cols)
    }
    setText(content:string):Node_{
        this.n.innerHTML=content
        return this
    }
}

class Table_ extends Node_{
    constructor(cellpadding:number=3,cellspacing:number=3,border:number=0){
        super("","table")
    }    
}

class Tr_ extends Node_{
    constructor(){
        super("","tr")
    }    
}

class Td_ extends Node_{
    constructor(colspan:number=1){
        super("","td")
        this.attr("colspan",""+colspan)
    }
}

class A_ extends Node_{
    constructor(href:string="",caption:string="",handler:(Event)=>void=null){
        super("","a")
        this.attr("href",href)
        this.innerHTML(caption)
        if(handler!=null){
            this.addel("mousedown",handler)            
        }
    }
}

class Br_ extends Node_{
    constructor(){
        super("","br")
    }
}

class Tab{
    id:string
    caption:string
    constructor(_id:string,_caption:string){
        this.id=_id
        this.caption=_caption
    }
}

class TabPane_ extends Node_{
    MARGIN=24
    UNSELECTED_TAB_BCOL="#dfdfdf"
    TABDIV_BCOL="#afffff"
    SELECTED_TAB_BCOL=this.TABDIV_BCOL

    tabs:Tab[]
    tabtds:Td_[]
    tabdivs:Div_[]
    table:Table_
    tr1:Tr_
    tr2:Tr_
    selid:string=null
    constructor(id:string,width:number,height:number,_tabs:Tab[],_selid:string=null){
        super(id,"div")
        this.selid=_selid
        this.tabs=_tabs
        this.tabtds=[]
        this.tabdivs=[]
        this.
            swpx(width).
            shpx(height).
            sovf("hidden").            
            finalize()
        this.table=new Table_()
        this.tr1=new Tr_()
        this.tr2=new Tr_()
        let ctd=new Td_().                
        spos("relative").
        finalize()
        for(let tabi in _tabs){
            let tab=_tabs[tabi]
            let ttd=new Td_().
                setId(this.tabtdId(tab.id)).
                sbcol(this.UNSELECTED_TAB_BCOL).                
                scur("pointer").
                html(tab.caption)
            ttd.addel("mousedown",this.tabhandler.bind(this,this.tabtdId(tab.id),tab.id))
            this.tabtds.push(ttd)
            this.tr1.a(ttd)            
            let div=new Div_(this.contentId(tab.id)).
                swpx(width-this.MARGIN).
                shpx(height-this.MARGIN).
                spos("absolute").
                stpx(0).
                slpx(0).
                sbcol(this.TABDIV_BCOL).
                sovf("scroll").
                sv(false).
                finalize()
            ctd.a(div)
            this.tabdivs.push(div)
            this.tr2.a(ctd)
        }        
        this.table.a(this.tr1)
        this.table.a(this.tr2)
        this.a(this.table)
        this.setSelected(this.selid)
    }
    setSelected(tabid:string=null){
        if(tabid==null){
            let storedselid=localStorage.getItem(this.id)
            if(storedselid!=undefined) this.selid=storedselid
            else this.selid=this.tabs[0].id
        }
        else this.selid=tabid
        for(let tabdivi in this.tabdivs){
            let tabdiv=this.tabdivs[tabdivi]
            let tab=this.tabs[tabdivi]
            let tabtd=this.tabtds[tabdivi]
            let v=(tab.id==this.selid)
            tabdiv.sv(v).finalize()
            tabtd.sbcol(v?this.SELECTED_TAB_BCOL:this.UNSELECTED_TAB_BCOL).finalize()
        }
        localStorage.setItem(this.id,this.selid)
    }
    tabhandler(tabtdid:string,tabid:string,e:Event){        
        this.setSelected(tabid)
    }
    tabtdId(tabid:string):string{return tabid+"_tabtd"}
    contentId(tabid:string):string{return tabid+"_content"}
    getTabIndexById(tabid:string):number{
        for(let ti in this.tabs){
            let tab=this.tabs[ti]
            if(tab.id==tabid) return parseInt(ti)
        }
        return 0
    }
    setContent(tabid:string,content:string){
        let ti=this.getTabIndexById(tabid)
        let tabdiv=this.tabdivs[ti]
        tabdiv.innerHTML(content)
    }
    setNode_(tabid:string,node_:Node_){
        let ti=this.getTabIndexById(tabid)
        let tabdiv=this.tabdivs[ti]
        tabdiv.a(node_)
    }
}

class Text_ extends Node_{
    constructor(){
        super("","input")
        this.n.setAttribute("type","text")
    }
    getText():string{
        let v=(<HTMLInputElement>this.n).value
        return v
    }
}