#ifndef CAMP_H
#define CAMP_H

#include <cstdint>
#include <string>
#include <utility>

struct result
{
    bool valid = false;
    int x = 0;
    int z = 0;
};

void initCamp(uint64_t seed);
result isCamp(int rx, int rz);
std::pair<int, int> campPos(int rx, int rz);
std::string campVariant(int rx, int rz);
bool hasSecretChest(const std::string &variantName);

#endif
