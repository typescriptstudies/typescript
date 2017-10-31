#include "types.h"

#ifndef UTILS_H

#define UTILS_H

// constants defining data structure sizes

#define NUM_STR_BUFFERS 10
#define STR_BUFFER_LENGTH 10000

#define MAX_BOARDS 10

#define MAX_MOVES 1000

// global data structures

extern uint8_t buff[NUM_STR_BUFFERS][STR_BUFFER_LENGTH];
extern Board boards[MAX_BOARDS];
extern Move movebuff[MAX_BOARDS][MAX_MOVES];
extern Move legalmovebuff[MAX_BOARDS][MAX_MOVES];
extern Move tempmovebuff[MAX_BOARDS][MAX_MOVES];
extern ExtendedMove extendedmovebuff[MAX_BOARDS][MAX_MOVES];

// global constants

extern const int VARIANT_STANDARD;
extern const int VARIANT_ATOMIC;
extern const int VARIANT_FOUR_PLAYER;
extern const int FOUR_PLAYER_BASE;

#define MAX_PIECES 10

#define STANDARD_PROMOTION_PIECE_KINDS (uint8_t[]){'n','b','r','q',0}

// utility definitions for buffer access and printing

typedef uint8_t* str;

#define INBUF (uint8_t*)&buff[0]
#define OUTBUF (uint8_t*)&buff[1]
#define OUTBUF2 (uint8_t*)&buff[2]
#define TEMPBUF (uint8_t*)&buff[3]
#define TEMPBUF2 (uint8_t*)&buff[4]
#define OUTBUF3 (uint8_t*)&buff[5]

extern str logptr;

// general utility functions

extern uint64_t addr(int buffer_index);
extern uint64_t getNumStrBuffers();
extern uint64_t getStrBufferLength();
extern str printNumber(int number,str ptr);
extern void toCase(uint64_t _case);
extern int absv(int x);

extern void _memcpy(uint8_t* from,uint8_t* to,int size);
extern str _strcpys(str from,str to,int size);
extern void _swap(uint8_t* p1,uint8_t* p2,int size);

extern void startlog();
extern void lognum(int n);
extern void logchar(uint8_t c);
extern void logstr(uint8_t* s);
extern void conslog();

#endif