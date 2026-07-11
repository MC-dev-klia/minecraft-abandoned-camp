#include "camp.h"

#include <cinttypes>

int main(int argc, char **argv)
{
    uint64_t seed = 12;
    int regionSpan = 10;

    if (argc > 1)
    {
        seed = static_cast<uint64_t>(std::strtoull(argv[1], nullptr, 0));
    }
    if (argc > 2)
    {
        regionSpan = std::atoi(argv[2]);
    }

    initCamp(seed);

    const int start = -regionSpan / 2;
    const int end = start + regionSpan;

    std::printf("Seed %" PRIu64 "\n", seed);
    std::printf("Scanning a %dx%d region grid around the origin for abandoned-camp placement\n", regionSpan, regionSpan);

    for (int rz = start; rz < end; ++rz)
    {
        for (int rx = start; rx < end; ++rx)
        {
            const result camp = isCamp(rx, rz);
            if (!camp.valid)
            {
                continue;
            }
            const std::string variant = campVariant(rx, rz);
            std::printf("region(%d,%d) pos=(%d,%d) camp=%s secretChest=%s\n",
                        rx,
                        rz,
                        camp.x,
                        camp.z,
                        variant.c_str(),
                        hasSecretChest(variant) ? "yes" : "no");
        }
    }
    return 0;
}
