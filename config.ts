namespace Config {
//////////////////////////////////////////////////////////////////////

export let scalefactor:number = 1.0

//////////////////////////////////////////////////////////////////////

export const SUPPORTED_VARIANTS = [
    "standard",
    "atomic",
    "fourplayer"
]

//////////////////////////////////////////////////////////////////////
// configuration constants

let STANDARD_NUM_PLAYERS                =   2
let FOUR_PLAYER_NUM_PLAYERS             =   4

let STANDARD_NUM_FILES                  =   8
let FOUR_PLAYER_NUM_FILES               =   14

let STANDARD_NUM_RANKS                  =   8
let FOUR_PLAYER_NUM_RANKS               =   14

let STANDARD_TURN_ADVANCER              =   {1:0,0:1}
let FOUR_PLAYER_TURN_ADVANCER           =   {1:2,2:0,0:3,3:1}

let STANDARD_PROMOTION_PIECES           =   ["n","b","r","q"]

let STANDARD_NON_PAWN_PIECES            =   ["n","b","r","q","k"]
let STANDARD_ALL_PIECES                 =   ["p","n","b","r","q","k"]

let STANDARD_PAWN_DIRECTIONS_BY_COLOR =
        [
            new Square(0,1),
            new Square(0,-1)
        ]

let FOUR_PLAYER_PAWN_DIRECTIONS_BY_COLOR =
        [
            new Square(0,1),
            new Square(0,-1),
            new Square(-1,0),
            new Square(1,0)
        ]

///*
let STANDARD_START_RAW_FEN =
        "r0n0b0q0k0b0n0r0"+
        "p0p0p0p0p0p0p0p0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "p1p1p1p1p1p1p1p1"+
        "r1n1b1q1k1b1n1r1"
//*/

// promotion test

/*
let STANDARD_START_RAW_FEN =
        "r0-0-0q0k0b0n0r0"+
        "p0p1p0p0p0p0p0p0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "p1p1p1p1p1p1p1p1"+
        "r1n1b1q1k1b1n1r1"        
*/

// castling test

/*
let STANDARD_START_RAW_FEN =
        "r0-0-0-0k0-0-0r0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "-0-0-0-0-0-0-0-0"+
        "r1-0-0-0k1-0-0r1"        
*/

let FOUR_PLAYER_START_RAW_FEN =
        "-0-0-0r0n0b0q0k0b0n0r0-0-0-0"+
        "-0-0-0p0p0p0p0p0p0p0p0-0-0-0"+
        "-0-0-0-0-0-0-0-0-0-0-0-0-0-0"+
        "r3p3-0-0-0-0-0-0-0-0-0-0p2r2"+
        "n3p3-0-0-0-0-0-0-0-0-0-0p2n2"+
        "b3p3-0-0-0-0-0-0-0-0-0-0p2b2"+
        "k3p3-0-0-0-0-0-0-0-0-0-0p2q2"+
        "q3p3-0-0-0-0-0-0-0-0-0-0p2k2"+
        "b3p3-0-0-0-0-0-0-0-0-0-0p2b2"+
        "n3p3-0-0-0-0-0-0-0-0-0-0p2n2"+
        "r3p3-0-0-0-0-0-0-0-0-0-0p2r2"+
        "-0-0-0-0-0-0-0-0-0-0-0-0-0-0"+
        "-0-0-0p1p1p1p1p1p1p1p1-0-0-0"+
        "-0-0-0r1n1b1k1q1b1n1r1-0-0-0"


//////////////////////////////////////////////////////////////////////

export const STANDARD_CASTLE_SAN_MAPPINGS=[
    new GlobalUtils.TwoWayMap({
        "O-O":"Kh8",
        "O-O-O":"Ka8"
    }),
    new GlobalUtils.TwoWayMap({
        "O-O":"Kh1",
        "O-O-O":"Ka1"
    })
]

//////////////////////////////////////////////////////////////////////
// configurations object

export class ChessConfiguration{
    variantId:string
    variantDisplayName:string
    variantCode:number
    numPlayers:number
    lastPlayer:number
    numFiles:number
    lastFile:number
    numRanks:number
    lastRank:number
    area:number
    turnAdvancer:{[id:number]:number}    
    promotionPieces:string[]
    canCastle:boolean=true
    standardReportable:boolean=false
    nonPawnPieces:string[]=STANDARD_NON_PAWN_PIECES
    nonPawnPiecesCapital:string[]
    allPieces:string[]=STANDARD_ALL_PIECES
    pawnDirectionsByColor:Square[]    
    startRawFen:string    
    constructor(
        _variantId:string,
        _variantDisplayName:string,
        _variantCode:number,
        parameters:{[id:string]:any}
    ){

        this.variantId=_variantId        
        this.variantDisplayName=_variantDisplayName
        this.variantCode=_variantCode

        for(let parameterId in parameters){
            let value=parameters[parameterId]
            switch(parameterId){
                case "numPlayers": this.numPlayers=value;break;
                case "numFiles": this.numFiles=value;break;
                case "numRanks": this.numRanks=value;break;                                
                case "turnAdvancer": this.turnAdvancer=value;break;
                case "promotionPieces": this.promotionPieces=value;break;
                case "canCastle": this.canCastle=value;break;
                case "standardReportable": this.standardReportable=value;break;
                case "nonPawnPieces": this.nonPawnPieces=value;break;
                case "allPieces": this.allPieces=value;break;
                case "pawnDirectionsByColor": this.pawnDirectionsByColor=value;break;
                case "startRawFen": this.startRawFen=value;break;
            }
        }                

        if(this.numPlayers==undefined) this.numPlayers = STANDARD_NUM_PLAYERS    

        if(this.numFiles==undefined){
            if(this.numPlayers==STANDARD_NUM_PLAYERS) this.numFiles = STANDARD_NUM_FILES
            else if(this.numPlayers==FOUR_PLAYER_NUM_PLAYERS) this.numFiles = FOUR_PLAYER_NUM_FILES
        }        

        if(this.numRanks==undefined){
            if(this.numPlayers==STANDARD_NUM_PLAYERS) this.numRanks = STANDARD_NUM_RANKS
            else if(this.numPlayers==FOUR_PLAYER_NUM_PLAYERS) this.numRanks = FOUR_PLAYER_NUM_RANKS
        }                        

        if(this.turnAdvancer==undefined){
            if(this.numPlayers==STANDARD_NUM_PLAYERS) this.turnAdvancer = STANDARD_TURN_ADVANCER
            else if(this.numPlayers==FOUR_PLAYER_NUM_PLAYERS) this.turnAdvancer = FOUR_PLAYER_TURN_ADVANCER
        }

        if(this.promotionPieces==undefined){
            this.promotionPieces=STANDARD_PROMOTION_PIECES
        }

        if(!this.standardReportable){
            if(this.numPlayers==2) this.standardReportable=true
        }

        if(this.pawnDirectionsByColor==undefined){
            if(this.numPlayers==STANDARD_NUM_PLAYERS) this.pawnDirectionsByColor = STANDARD_PAWN_DIRECTIONS_BY_COLOR
            else if(this.numPlayers==FOUR_PLAYER_NUM_PLAYERS) this.pawnDirectionsByColor = FOUR_PLAYER_PAWN_DIRECTIONS_BY_COLOR
        }

        if(this.startRawFen==undefined){
            if(this.numPlayers==STANDARD_NUM_PLAYERS) this.startRawFen = STANDARD_START_RAW_FEN
            else if(this.numPlayers==FOUR_PLAYER_NUM_PLAYERS) this.startRawFen = FOUR_PLAYER_START_RAW_FEN
        }

        this.lastPlayer=this.numPlayers-1
        this.lastFile=this.numFiles-1
        this.lastRank=this.numRanks-1
        this.area=this.numFiles*this.numRanks
        this.nonPawnPiecesCapital=this.nonPawnPieces.map(x=>x.toUpperCase())
    }
}

//////////////////////////////////////////////////////////////////////
// configurations

let STANDARD_CHESS_CONFIGURATION = new ChessConfiguration(
    "standard",
    "Standard",
    201,
    {}
)

let ATOMIC_CHESS_CONFIGURATION = new ChessConfiguration(
    "atomic",
    "Atomic",
    202,
    {}
)

let FOUR_PLAYER_CHESS_CONFIGURATION = new ChessConfiguration(
    "fourplayer",
    "Four Player",
    401,
    {
        "numPlayers" : FOUR_PLAYER_NUM_PLAYERS
    }
)

//////////////////////////////////////////////////////////////////////
// configuration manager

class ChessConfigurationManager{
    configurations:{[id:string]:ChessConfiguration}
    constructor(configurationList:ChessConfiguration[]){
        this.configurations={}
        for(let i in configurationList){
            let configuration=configurationList[i]
            this.configurations[configuration.variantId]=configuration
        }
    }
    getConfigurationByVariantId(variantId:string):ChessConfiguration{
        return this.configurations[variantId]
    }
}

//////////////////////////////////////////////////////////////////////

export let chessConfigurationManager=new ChessConfigurationManager([
    STANDARD_CHESS_CONFIGURATION,
    ATOMIC_CHESS_CONFIGURATION,
    FOUR_PLAYER_CHESS_CONFIGURATION
])

//////////////////////////////////////////////////////////////////////

const MOVE_VECTORS_BY_PIECE_KIND : {[id:string]:Square[]} = {
    "n":[
        new Square(1,2),
        new Square(1,-2),
        new Square(-1,2),
        new Square(-1,-2),
        new Square(2,1),
        new Square(2,-1),
        new Square(-2,1),        
        new Square(-2,-1)
    ],
    "b":[
        new Square(1,1),
        new Square(1,-1),
        new Square(-1,1),
        new Square(-1,-1)
    ],
    "r":[
        new Square(1,0),
        new Square(-1,0),
        new Square(0,1),
        new Square(0,-1)
    ],
    "q":[
        new Square(1,0),
        new Square(-1,0),
        new Square(0,1),
        new Square(0,-1),
        new Square(1,1),
        new Square(1,-1),
        new Square(-1,1),
        new Square(-1,-1)
    ]
}

export function getMovevectorsByPieceKind(kind:string):Square[]{
    // use queen vectors for king
    let k=(kind!="k"?kind:"q")
    return MOVE_VECTORS_BY_PIECE_KIND[k]
}

//////////////////////////////////////////////////////////////////////

export function Scaled(coord:number){return coord * scalefactor}
export function UnScaled(coord:number){return coord / scalefactor}

//////////////////////////////////////////////////////////////////////

}