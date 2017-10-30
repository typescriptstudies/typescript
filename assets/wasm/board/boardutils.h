#include "types.h"

#ifndef BOARDUTILS_H

#define BOARDUTILS_H

typedef struct{
	Board* b;
	uint8_t* cptr;
	uint8_t kind;
	int f;
	int r;
	Square sq;
	uint8_t castling;
} Tokenizer;

extern void pullKind(Tokenizer* t);
extern void pullFile(Tokenizer *t);
extern void pullRank(Tokenizer *t);
extern void pullSquare(Tokenizer *t);
extern void pullPromPiece(Tokenizer *t);
extern void pullCastling(Tokenizer *t);

extern uint8_t fileOk(Board *b,uint8_t f);
extern uint8_t rankOk(Board *b,uint8_t f);
extern uint8_t fileRankOk(Board *b,uint8_t f,uint8_t r);
extern uint8_t isSquareValid(Board *b,Square sq);
extern Square plusSquare(Square sq1,Square sq2);
extern Square minusSquare(Square sq1,Square sq2);
extern Square rotateSquare(Square sq,int rot);
extern Square normalizeSquare(Square sq);
extern uint8_t isSquareEqualTo(Square sq1,Square sq2);
extern uint8_t isSquareRoughlyEqualTo(Square sq1,Square sq2);
extern Piece pieceAtSquare(Board* b,Square sq);
extern uint8_t isSquareEmpty(Board* b,Square sq);
extern int colorOfPieceAtSquare(Board* b,Square sq);
extern uint8_t isSameColorAtSquare(Board* b,Square sq,uint8_t color);
extern uint8_t isDifferentColorAtSquare(Board* b,Square sq,uint8_t color);
extern str squareToAlgeb(Board *b,Square sq,str ptr);
extern str moveToAlgeb(Board *b,Move m,uint8_t detail,str ptr);
extern Square pawnDirection(Board *b,uint8_t color);
extern Square effectiveDirection(Square template,int dc);

extern uint8_t hasEpSquare(Board* b,Square sq);

extern uint8_t recordMove(Board* b);
extern uint8_t* promotionPieceKinds(Board* b);
extern uint8_t recordPromotionMove(Board* b);
extern void setDefaultsOnMove(Move* mptr);
extern uint8_t defaultMove(Board *b);

extern uint8_t nextTurn(Board* b,uint8_t t);
extern void advanceTurnOnce(Board* b);
extern void advanceTurn(Board* b);
extern Board* getBoardI(uint8_t i);

extern void setTurn(uint8_t i,uint8_t t);
extern void setFullmoveNumber(uint8_t i,int fn);
extern void setHalfmoveClock(uint8_t i,int hc);
extern void resetEpSquares(Board* b);
extern void resetEpSquaresI(uint8_t i);
extern void resetCastlingRegistries(Board* b);
extern void resetCastlingRegistriesI(uint8_t i);
extern void setEpSquare(uint8_t i,uint8_t color,uint8_t epf,uint8_t epr,uint8_t epclf,uint8_t epclr,uint8_t cnt);
extern void setCastlingRegistry(uint8_t i,uint8_t ci,uint8_t cs,uint8_t right,uint8_t kf,uint8_t kr,uint8_t rf,uint8_t rr);
extern void setCastlingRegistryEmpty(uint8_t i,uint8_t ci,uint8_t cs,uint8_t si,uint8_t f,uint8_t r);
extern void setCastlingRegistryPassing(uint8_t i,uint8_t ci,uint8_t cs,uint8_t si,uint8_t f,uint8_t r);

extern uint8_t* allPieceKinds(Board* b);

extern uint8_t isMoveRoughlyEqualTo(Move m1,Move m2);

#endif