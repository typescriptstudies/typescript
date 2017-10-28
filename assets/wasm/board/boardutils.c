#include "types.h"
#include "utils.h"
#include "boardutils.h"

// utility board functions

uint8_t fileOk(Board *b,uint8_t f){
	return ((f>=0)&&(f<b->numfiles));
}

uint8_t rankOk(Board *b,uint8_t r){
	return ((r>=0)&&(r<b->numranks));
}

uint8_t fileRankOk(Board *b,uint8_t f,uint8_t r){
	return (fileOk(b,f)&&rankOk(b,r));
}

uint8_t isSquareValid(Board *b,Square sq){
	return fileRankOk(b,sq.f,sq.r);
}

Square plusSquare(Square sq1,Square sq2){
	return (Square){ sq1.f + sq2.f , sq1.r + sq2.r };
}

Square minusSquare(Square sq1,Square sq2){
	return (Square){ sq1.f - sq2.f , sq1.r - sq2.r };
}

Square rotateSquare(Square sq,int rot){
	switch(rot){
		case 1:return (Square){sq.r,-sq.f};
		case -1:return (Square){-sq.r,sq.f};
		default:return sq;
	}
}

extern Square normalizeSquare(Square sq){
	if(sq.f>0) sq.f=1; else if(sq.f<0) sq.f=-1;
	if(sq.r>0) sq.r=1; else if(sq.r<0) sq.r=-1;
	return sq;
}

uint8_t isSquareEqualTo(Square sq1,Square sq2){
	if(sq1.f!=sq2.f) return 0;
	return sq1.r==sq2.r;
}

uint8_t isSquareRoughlyEqualTo(Square sq1,Square sq2){
	if((sq2.f<0)&&(sq2.r<0)) return 1;
	if(sq2.f<0) return (sq1.r=sq2.r);
	if(sq2.r<0) return (sq1.f=sq2.f);
	return 1;
}

Piece pieceAtSquare(Board* b,Square sq){	
	return b->rep[sq.r][sq.f];
}

uint8_t isSquareEmpty(Board* b,Square sq){
	return b->rep[sq.r][sq.f].kind=='-';
}

// returns -1 if square is empty
int colorOfPieceAtSquare(Board* b,Square sq){
	if(!isSquareValid(b,sq)) return -1;
	if(isSquareEmpty(b,sq)) return -1;
	return b->rep[sq.r][sq.f].color;
}

uint8_t isSameColorAtSquare(Board* b,Square sq,uint8_t color){
	int test=colorOfPieceAtSquare(b,sq);
	if(test<0) return 0;
	return test==color;
}

uint8_t isDifferentColorAtSquare(Board* b,Square sq,uint8_t color){
	int test=colorOfPieceAtSquare(b,sq);
	if(test<0) return 0;
	return test!=color;
}

Square pawnDirection(Board *b,uint8_t color){
	Square dir;
	if(b->variant<FOUR_PLAYER_BASE){
		dir.f=0;
		dir.r=(color=='0'?1:-1);
		return dir;
	} else {
		switch(color){
			case '0':return (Square){0,1};
			case '1':return (Square){0,-1};
			case '2':return (Square){-1,0};			
			default:return (Square){1,0};
		}
	}
}

// fill in zero file / rank with dc
Square effectiveDirection(Square template,int dc){
	if(template.f==0) template.f=dc;
	if(template.r==0) template.r=dc;
	return template;
}

str squareToAlgeb(Board *b,Square sq,str ptr){			
	int f=sq.f;
	int r=sq.r;
	if(f>=0){
		*ptr++=f+'a';
	} else *ptr++='?';
	if(r>=0){
		ptr=printNumber(b->lastrank-r+1,ptr);
	} else *ptr++='?';
	*ptr=0;
	return ptr;
}

str moveToAlgeb(Board *b,Move m,uint8_t detail,str ptr){	
	if(m.invalid){
		*ptr++='#';
		*ptr=0;
		return ptr;
	}
	if(detail) *ptr++=b->rep[m.fsq.r][m.fsq.f].kind+'A'-'a';
	ptr=squareToAlgeb(b,m.fsq,ptr);
	if((detail)&&(m.capture)) *ptr++='x';
	ptr=squareToAlgeb(b,m.tsq,ptr);
	if(m.promotion){
		if(detail){
			*ptr++='=';
			*ptr++=m.prompiece.kind+'A'-'a';
		} else {
			*ptr++=m.prompiece.kind;
		}
	}
	*ptr=0;
	return ptr;
}

uint8_t moveBufferFull(Board *b){
	Move* base=b->stm?(Move*)&tempmovebuff[b->index]:(Move*)&movebuff[b->index];
	return ((b->mptr-base)>=(MAX_MOVES-1));
}

uint8_t hasEpSquare(Board* b,Square sq){
	for(int ei=0;ei<b->numplayers;ei++){
		if(isSquareEqualTo(b->epsqs[ei].epsq,sq)) return 1;
	}
	return 0;
}

uint8_t recordMove(Board* b){
	if(moveBufferFull(b)) return 0;	
	b->mptr->invalid=0;
	b->mptr++;
	b->mptr->invalid=1;
	return 1;
}

uint8_t promotionPieceKinds_buff[MAX_PIECES];
uint8_t* promotionPieceKinds(Board* b){
	uint8_t* kptr0;
	kptr0=STANDARD_PROMOTION_PIECE_KINDS;
	uint8_t* kptr=kptr0;
	do {
		promotionPieceKinds_buff[kptr-kptr0]=*kptr;
	} while(*kptr++!=0);
	return promotionPieceKinds_buff;
}

uint8_t recordPromotionMove(Board* b){	
	uint8_t* promkinds=promotionPieceKinds(b);
	uint8_t* promkind=(uint8_t*)promkinds;	
	while(*promkind!=0){
		if(moveBufferFull(b)) return 0;
		if((promkind-promkinds)>0) _memcpy((uint8_t*)(b->mptr-1),(uint8_t*)(b->mptr),sizeof(Move));		
		b->mptr->invalid=0;
		b->mptr->prompiece.kind=*promkind;
		promkind++;
		b->mptr++;
		b->mptr->invalid=1;
	}
	return 1;
}

void setDefaultsOnMove(Move* mptr){
	mptr->capture=0;
	mptr->pawnmove=0;
	mptr->pawnpush=0;
	mptr->pawnpushbytwo=0;
	mptr->epcapture=0;
	mptr->promotion=0;
	mptr->castling=0;
	mptr->prompiece.kind='-';
}

extern uint8_t defaultMove(Board *b){
	if(moveBufferFull(b)) return 0;
	setDefaultsOnMove(b->mptr);
	return 1;
}

uint8_t nextTurn(Board* b,uint8_t t){
	if(b->variant<FOUR_PLAYER_BASE){
		return t=='1'?'0':'1';
	} else {
		switch(t){
			case '1':return '2';
			case '2':return '0';
			case '0':return '3';
			case '3':return '1';
			default: return 0;
		}
	}
}

void advanceTurnOnce(Board* b){
	b->turn=nextTurn(b,b->turn);
}

void advanceTurn(Board* b){
	advanceTurnOnce(b);
}

Board* getBoardI(uint8_t i){
	return &boards[i];
}

void setTurn(uint8_t i,uint8_t t){
	getBoardI(i)->turn=t;
}

void setFullmoveNumber(uint8_t i,int fn){
	getBoardI(i)->fullmove_number=fn;
}

void setHalfmoveClock(uint8_t i,int hc){
	getBoardI(i)->halfmove_clock=hc;
}

void resetEpSquares(Board* b){
	for(int color=0;color<b->numplayers;color++){
		b->epsqs[color].cnt=0;
	}
}

extern void resetEpSquaresI(uint8_t i){
	resetEpSquares(getBoardI(i));
}

void resetCastlingRegistries(Board* b){
	for(int ci=0;ci<b->numplayers;ci++){
		for(int cs=0;cs<MAX_CASTLING_SIDES;cs++){
			b->castregs[ci][cs].right=0;
			for(int si=0;si<(MAX_FILES+1);si++){
				b->castregs[ci][cs].emptysqs[si].f=-1;
				b->castregs[ci][cs].emptysqs[si].r=-1;
				b->castregs[ci][cs].passingsqs[si].f=-1;
				b->castregs[ci][cs].passingsqs[si].r=-1;
			}
		}		
	}
}

void resetCastlingRegistriesI(uint8_t i){
	resetCastlingRegistries(getBoardI(i));	
}

void setCastlingRegistry(uint8_t i,uint8_t ci,uint8_t cs,uint8_t right,uint8_t kf,uint8_t kr,uint8_t rf,uint8_t rr){
	Board* b=getBoardI(i);
	b->castregs[ci][cs].right=right;
	b->castregs[ci][cs].kingsq=(Square){kf,kr};
	b->castregs[ci][cs].rooksq=(Square){rf,rr};
}

void setCastlingRegistryEmpty(uint8_t i,uint8_t ci,uint8_t cs,uint8_t si,uint8_t f,uint8_t r){
	Board* b=getBoardI(i);
	b->castregs[ci][cs].emptysqs[si]=(Square){f,r};
}

void setCastlingRegistryPassing(uint8_t i,uint8_t ci,uint8_t cs,uint8_t si,uint8_t f,uint8_t r){
	Board* b=getBoardI(i);
	b->castregs[ci][cs].passingsqs[si]=(Square){f,r};
}

void setEpSquare(uint8_t i,uint8_t color,uint8_t epf,uint8_t epr,uint8_t epclf,uint8_t epclr,uint8_t cnt){
	EpSquare epsq=(EpSquare){
		(Square){epf,epr},
		(Square){epclf,epclr},
		cnt
	};
	getBoardI(i)->epsqs[color-'0']=epsq;
}

uint8_t piece_kind_buff[MAX_PIECES+1];

uint8_t* allPieceKinds(Board* b){
	uint8_t* pptr=(uint8_t*)&piece_kind_buff;
	*pptr++='p';
	*pptr++='n';
	*pptr++='b';
	*pptr++='r';
	*pptr++='q';
	*pptr++='k';
	*pptr++=0;
	return (uint8_t*)&piece_kind_buff;
}

uint8_t nextChar(Tokenizer* t){
	while(*t->cptr!=0){
		uint8_t c=*t->cptr;		
		if(c=='x'){
			// ignore
			t->cptr++;
		} else {
			return c;
		}
	}
	return 0;
}

void pullKind(Tokenizer* t){
	t->kind='-';
	uint8_t c=nextChar(t);
	if((c>='A')&&(c<='Z')){
		t->kind=c+'a'-'A';
		t->cptr++;
	}
}

void pullFile(Tokenizer* t){
	t->f=-1;
	uint8_t c=nextChar(t);
	if((c>='a')&&(c<='z')){
		t->f=c-'a';
		t->cptr++;
	}
}

void pullRank(Tokenizer* t){
	t->r=-1;
	uint8_t c=nextChar(t);
	if((c>='0')&&(c<='9')){
		uint8_t num=0;
		while((c>='0')&&(c<='9')){
			num=num*10+c-'0';		
			t->cptr++;
			c=nextChar(t);
		}
		t->r=t->b->lastrank-(num-1);
	}
}

void pullSquare(Tokenizer* t){
	pullFile(t);
	pullRank(t);
	t->sq=(Square){t->f,t->r};
}

void pullPromPiece(Tokenizer* t){
	t->kind='-';
	uint8_t c=nextChar(t);
	if(c=='='){
		t->cptr++;
		c=nextChar(t);
		if(c!=0){			
			if((c>='A')&&(c<='Z')){
				t->kind=c+'a'-'A';
				t->cptr++;
			}
			if((c>='a')&&(c<='z')){
				t->kind=c;
				t->cptr++;
			}
		}
	}
}

void pullCastling(Tokenizer *t){
	t->castling='-';
	uint8_t c=nextChar(t);
	if(c=='O'){
		t->cptr++;
		c=nextChar(t);
		if(c=='-'){
			t->cptr++;
			c=nextChar(t);
			{
				if(c=='O'){
					t->cptr++;
					c=nextChar(t);
					if(c=='-'){
						t->cptr++;
						c=nextChar(t);
						if(c=='O'){
							t->cptr++;
							t->castling='l';
							return;
						}
					} else {
						t->castling='s';
						return;
					}
				}
			}
		}
	}
}