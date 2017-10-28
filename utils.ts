namespace Utils {
    export class ScreenVector{
        x:number; y:number
        constructor(_x:number,_y:number){this.x=_x;this.y=_y}
        Scaled():ScreenVector{
            return new ScreenVector(Config.Scaled(this.x),Config.Scaled(this.y))
        }
        UnScaled():ScreenVector{
            return new ScreenVector(Config.UnScaled(this.x),Config.UnScaled(this.y))
        }
        Plus(sv:ScreenVector):ScreenVector{
            return new ScreenVector(this.x + sv.x,this.y + sv.y)
        }
        Minus(sv:ScreenVector):ScreenVector{
            return new ScreenVector(this.x - sv.x,this.y - sv.y)
        }
    }

    export const FILE_LETTER=["a","b","c","d","e","f","g","h","i","j","k","l","m","n"]
    export const DECIMAL_LETTER=["0","1","2","3","4","5","6","7","8","9"]
    export const RANK_LETTER=DECIMAL_LETTER
    export const FILE_LETTER_TO_FILE={"a":0,"b":1,"c":2,"d":3,"e":4,"f":5,"g":6,"h":7,"i":8,"j":9,"k":10,"l":11,"m":12,"n":13}
    export const FILE_TO_FILE_LETTER={0:"a",1:"b",2:"c",3:"d",4:"e",5:"f",6:"g",7:"h",8:"i",9:"j",10:"k",11:"l",12:"m",13:"n"}
    export function idpart(id:string,index:number):string{
        let parts=id.split("_")
        return parts[index]
    }
    export class Tokenizer{
        content:string
        tokens:string[]
        constructor(_content:string){
            this.content=_content
            this.tokens=_content.split("")
        }
        pull(accept:string[],maxnum:number=100):string{
            let buffer=""           
            while((this.tokens.length>0)&&(maxnum>0)){
                let c=this.tokens[0]
                if(accept!=null){
                    if(accept.indexOf(c)<0) return buffer
                    buffer+=this.tokens.shift()          
                } else {                    
                    if(c==" ") return buffer
                    buffer+=this.tokens.shift()
                }          
                maxnum--      
            }
            return buffer
        }
        pullUntil(stopat:string){
            let buffer=""           
            while(this.tokens.length>0){
                let c=this.tokens[0]
                
                if(c==stopat) return buffer
                
                buffer+=this.tokens.shift()
            }
            return buffer
        }
        pullSquare(b:Board):Square{
            let fstr=this.pull(FILE_LETTER,1)
            if(fstr!=""){
                let rstr=this.pull(RANK_LETTER)
                if(rstr!=""){
                    let algeb=fstr+rstr
                    return b.algebToSquare(algeb)
                } else {
                    let f=BoardUtils.fileLetterToFile(fstr)
                    return new Square(f,null)
                }
            } else {
                let rstr=this.pull(RANK_LETTER)
                if(rstr!=""){
                    let r=BoardUtils.rankLetterToRank(b,rstr)
                    return new Square(null,r)
                } else {
                    return null
                }
            }
        }
        pullSan():string{
            this.pull([" "])
            this.pull(DECIMAL_LETTER)
            this.pull(["."," "])
            return this.pull(null)
        }
    }

    export class ThinkingOutput{
        prot:string
        variant:string

        bestmove:string=""
        scorecp:boolean=true
        scoremate:boolean=false
        score=0
        depth=0

        constructor(_prot:string="uci",_variant:string="standard"){
            this.prot=_prot
            this.variant=_variant
        }

        parseuci(buffer:string){
            let parts=buffer.split(new RegExp("^info "))
            if(parts.length<2){
                //console.log("uci string without info "+buffer)
                return
            }            
            let infoparts=parts[1].split(" ")            
            let parsekey:boolean=true
            let key:string
            let pvitems:string[]=[]
            for(let i in infoparts){                
                if(parsekey){
                    key=infoparts[i]
                    parsekey=false
                }
                else {
                    let value=infoparts[i]
                    if(key=="score"){
                        if(value=="cp"){
                            this.scorecp=true
                        } else if(value=="mate") {
                            this.scoremate=true
                        } else {
                            this.score=parseInt(value)
                            parsekey=true
                        }
                    }
                    else if(key=="depth"){
                        this.depth=parseInt(value)
                        parsekey=true
                    }
                    else if(key=="pv")                    
                    {
                        pvitems.push(value)
                    }
                    else{
                        parsekey=true
                    }
                }
            }
            if(pvitems.length>0){
                this.bestmove=pvitems[0]
            }
        }

        parse(buffer:string){
            let buffercleaned=buffer.replace(new RegExp("\\r","g"),"")
            if(this.prot=="uci"){
              this.parseuci(buffercleaned)
            }
        }
    }
        
}