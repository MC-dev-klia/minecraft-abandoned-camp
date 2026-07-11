#ifndef CAMP_H
#define CAMP_H

#include <stdint.h>

#ifdef __cplusplus
#include <cstdbool>
extern "C" {
#else
#include <stdbool.h>
#endif

typedef struct
{
    bool valid;
    int x;
    int z;
} result;

void initCamp(uint64_t seed);
result isCamp(int rx, int rz);
result campPos(int rx, int rz);
const char *campVariant(int rx, int rz);
bool hasSecretChest(const char *variantName);

#ifdef __cplusplus
}
#endif

#endif
