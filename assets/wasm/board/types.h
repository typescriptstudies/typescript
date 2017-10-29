#ifndef TYPES_H

#define TYPES_H

#include <stdint.h>

#define MAX_FILES 14
#define MAX_RANKS 14

#define MAX_PLAYERS 4

#define MAX_CASTLING_SIDES 2

#define MAX_SAN_LENGTH 20

#define MAX_STRUCT_SIZE 10000

// square

typedef struct{
	int8_t f;
	int8_t r;
} Square;

// epsquare

typedef struct{
	Square epsq;
	Square epclsq;
	uint8_t cnt;
} EpSquare;

// piece

typedef struct{
	uint8_t kind;
	uint8_t color;
} Piece;

// move

typedef struct{
	// all fields default to 0
	uint8_t invalid; // 1 for an invalid move to signal the end of a movelist
	Square fsq; // from square	
	Square tsq; // to square
	Piece prompiece; // promotion piece
	uint8_t capture; // 1 for capture move
	uint8_t pawnmove; // 1 for pawn move
	uint8_t pawnpush; // 1 for pawn push ( forward )
	uint8_t pawnpushbytwo; // 1 for double pawn advance
	uint8_t epcapture; // 1 for ep capture
	uint8_t promotion; // 1 for promotion
	uint8_t castling; // 1 for castling
	Square epsq; // ep square
	Square epclsq; // ep clear square
} Move;

typedef struct{
	Move m;
	uint8_t san[MAX_SAN_LENGTH+1];
} ExtendedMove;

// castling registry

typedef struct
{
	uint8_t right;
	Square kingsq;
	Square rooksq;
	Square emptysqs[MAX_FILES+1];
	Square passingsqs[MAX_FILES+1];
} CastlingRegistry;

// board

typedef struct{
	uint8_t test;
	int index;
	int variant;
	int numfiles;
	int lastfile;
	int numranks;
	int lastrank;
	int numplayers;
	int lastplayer;
	Move* mptr;
	Piece rep[MAX_RANKS][MAX_FILES]; // board representation
	EpSquare epsqs[MAX_PLAYERS]; // ep squares
	uint8_t turn; // turn character '0' , '1' ... etc. - white is always '1' black is always '0'
	int fullmove_number;
	int halfmove_clock;
	uint8_t checkattack;	
	uint8_t isattack;
	CastlingRegistry castregs[MAX_PLAYERS][MAX_CASTLING_SIDES];
	uint8_t stm;
	Move sanm;
} Board;

#endif