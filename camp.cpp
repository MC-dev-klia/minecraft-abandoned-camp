#include "camp.h"

#include "cubiomes/finders.h"
#include "cubiomes/generator.h"
#include "cubiomes/util.h"

#include <algorithm>
#include <array>
#include <cinttypes>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <string>
#include <unordered_set>
#include <utility>
#include <vector>

namespace {

constexpr int kCampSpacing = 34;
constexpr int kCampSeparation = 8;
constexpr int32_t kCampSalt = 91231127;

constexpr uint64_t kMask48 = (1ULL << 48) - 1ULL;
constexpr uint64_t kJavaMultiplier = 0x5DEECE66DULL;
constexpr uint64_t kJavaAddend = 0xBULL;

class JavaRandom
{
public:
    explicit JavaRandom(uint64_t seed = 0) { setSeed(seed); }

    void setSeed(uint64_t seed)
    {
        state_ = (seed ^ kJavaMultiplier) & kMask48;
    }

    int nextInt(int bound)
    {
        if (bound <= 0)
        {
            return 0;
        }
        if ((bound & -bound) == bound)
        {
            const uint32_t bits = nextBits(31);
            return static_cast<int>((static_cast<uint64_t>(bound) * static_cast<uint64_t>(bits)) >> 31);
        }
        int bits;
        int value;
        do
        {
            bits = nextBits(31);
            value = bits % bound;
        } while ((bits - value + (bound - 1)) < 0);
        return value;
    }

    uint64_t nextLong()
    {
        const int32_t hi = static_cast<int32_t>(nextBits(32));
        const int32_t lo = static_cast<int32_t>(nextBits(32));
        return static_cast<uint64_t>((static_cast<int64_t>(hi) << 32) + static_cast<int64_t>(lo));
    }

private:
    uint32_t nextBits(int bits)
    {
        state_ = (state_ * kJavaMultiplier + kJavaAddend) & kMask48;
        return static_cast<uint32_t>((state_ >> (48 - bits)) & ((1ULL << bits) - 1ULL));
    }

    uint64_t state_ = 0;
};

struct TentEntry
{
    std::string name;
    int weight;
    std::array<int, 3> size;
};

struct CampBiomePool
{
    std::string biomeKey;
    std::vector<TentEntry> tents;
};

std::array<int, 3> rotateOffset(const std::array<int, 3> &size, int rotation)
{
    const int x = size[0] - 1;
    const int y = size[1] - 1;
    const int z = size[2] - 1;

    switch (rotation)
    {
    case 0:
        return {x, y, z};
    case 1:
        return {-z, y, x};
    case 2:
        return {-x, y, -z};
    case 3:
    default:
        return {z, y, -x};
    }
}

std::vector<TentEntry> makeTentPool(std::initializer_list<std::pair<const char *, std::array<int, 3>>> entries)
{
    std::vector<TentEntry> out;
    out.reserve(entries.size());
    for (const auto &entry : entries)
    {
        out.push_back({entry.first, 1, entry.second});
    }
    return out;
}

JavaRandom makeRegionRng(uint64_t worldSeed, int regX, int regZ, int32_t salt)
{
    int64_t seed64 = static_cast<int64_t>(regX) * 341873128712LL;
    seed64 += static_cast<int64_t>(regZ) * 132897987541LL;
    seed64 += static_cast<int64_t>(worldSeed) + static_cast<int64_t>(salt);
    uint64_t seed = static_cast<uint64_t>(seed64) & kMask48;
    return JavaRandom(seed);
}

JavaRandom makePlacementRng(uint64_t worldSeed, int chunkX, int chunkZ)
{
    JavaRandom base(worldSeed);
    int64_t a = static_cast<int64_t>(chunkX) * static_cast<int64_t>(base.nextLong());
    int64_t c = static_cast<int64_t>(chunkZ) * static_cast<int64_t>(base.nextLong());
    uint64_t seed = (static_cast<uint64_t>(a) ^ static_cast<uint64_t>(c) ^ worldSeed) & kMask48;
    return JavaRandom(seed);
}

std::vector<std::string> makeCampVariantList(bool bedrock, const std::string &biomeKey)
{
    std::vector<std::string> chest;
    std::vector<std::string> barrel;
    std::vector<std::string> special;
    std::vector<std::string> biomeSpecific;

    chest.reserve(15);
    barrel.reserve(15);
    special.reserve(15);
    biomeSpecific.reserve(3);

    for (int i = 0; i < 15; ++i)
    {
        chest.push_back("campsite_default_chest_" + std::to_string(i + 1));
    }
    for (int i = 0; i < 15; ++i)
    {
        barrel.push_back("campsite_default_barrel_" + std::to_string(i + 1));
    }
    for (int i = 0; i < 15; ++i)
    {
        special.push_back("campsite_default_special_" + std::to_string(i + 1));
    }
    for (int i = 0; i < 3; ++i)
    {
        biomeSpecific.push_back("campsite_" + biomeKey + "_" + std::to_string(i + 1));
    }

    if (bedrock)
    {
        std::sort(barrel.begin(), barrel.end());
        std::sort(chest.begin(), chest.end());
        std::sort(special.begin(), special.end());
        std::sort(biomeSpecific.begin(), biomeSpecific.end());

        std::vector<std::string> out;
        out.reserve(biomeSpecific.size() + barrel.size() + chest.size() + special.size());
        out.insert(out.end(), biomeSpecific.begin(), biomeSpecific.end());
        out.insert(out.end(), barrel.begin(), barrel.end());
        out.insert(out.end(), chest.begin(), chest.end());
        out.insert(out.end(), special.begin(), special.end());
        return out;
    }

    std::vector<std::string> out;
    out.reserve(chest.size() + barrel.size() + special.size() + biomeSpecific.size());
    out.insert(out.end(), chest.begin(), chest.end());
    out.insert(out.end(), barrel.begin(), barrel.end());
    out.insert(out.end(), special.begin(), special.end());
    out.insert(out.end(), biomeSpecific.begin(), biomeSpecific.end());
    return out;
}

void shuffleCampVariants(std::vector<std::string> &variants, JavaRandom &rng)
{
    for (int i = static_cast<int>(variants.size()); i > 1; --i)
    {
        const int index = rng.nextInt(i);
        std::swap(variants[index], variants[i - 1]);
    }
}

const std::vector<CampBiomePool> &getBiomePools()
{
    static const std::vector<CampBiomePool> biomePools = {
        {"bamboo_jungle", makeTentPool({{"tent_bamboo_jungle_1", {8, 8, 8}}, {"tent_bamboo_jungle_2", {8, 8, 8}}, {"tent_bamboo_jungle_3", {6, 8, 8}}, {"tent_bamboo_jungle_4", {8, 8, 8}}, {"tent_bamboo_jungle_5", {8, 8, 8}}, {"tent_bamboo_jungle_6", {8, 8, 8}}, {"tent_bamboo_jungle_7", {8, 8, 8}}, {"tent_bamboo_jungle_8", {6, 8, 8}}, {"tent_bamboo_jungle_9", {8, 8, 8}}, {"tent_bamboo_jungle_10", {8, 8, 8}}})},
        {"birch_forest", makeTentPool({{"tent_birch_forest_1", {8, 10, 8}}, {"tent_birch_forest_2", {8, 8, 8}}, {"tent_birch_forest_3", {6, 8, 8}}, {"tent_birch_forest_4", {8, 8, 8}}, {"tent_birch_forest_5", {8, 8, 8}}, {"tent_birch_forest_6", {8, 8, 8}}, {"tent_birch_forest_7", {8, 8, 8}}, {"tent_birch_forest_8", {6, 8, 8}}, {"tent_birch_forest_9", {8, 8, 8}}, {"tent_birch_forest_10", {8, 8, 8}}})},
        {"cherry_grove", makeTentPool({{"tent_cherry_grove_1", {8, 11, 8}}, {"tent_cherry_grove_2", {8, 8, 8}}, {"tent_cherry_grove_3", {6, 8, 8}}, {"tent_cherry_grove_4", {8, 8, 8}}, {"tent_cherry_grove_5", {8, 8, 8}}, {"tent_cherry_grove_6", {8, 8, 8}}, {"tent_cherry_grove_7", {8, 8, 8}}, {"tent_cherry_grove_8", {6, 8, 8}}, {"tent_cherry_grove_9", {8, 8, 8}}, {"tent_cherry_grove_10", {8, 8, 8}}})},
        {"dappled_forest", makeTentPool({{"tent_dappled_forest_1", {8, 8, 8}}, {"tent_dappled_forest_2", {8, 9, 8}}, {"tent_dappled_forest_3", {6, 8, 8}}, {"tent_dappled_forest_4", {8, 9, 8}}, {"tent_dappled_forest_5", {8, 8, 8}}, {"tent_dappled_forest_6", {8, 8, 8}}, {"tent_dappled_forest_7", {8, 8, 8}}, {"tent_dappled_forest_8", {6, 8, 8}}, {"tent_dappled_forest_9", {8, 8, 8}}, {"tent_dappled_forest_10", {8, 8, 8}}})},
        {"flower_forest", makeTentPool({{"tent_flower_forest_1", {8, 8, 8}}, {"tent_flower_forest_2", {8, 8, 8}}, {"tent_flower_forest_3", {6, 8, 8}}, {"tent_flower_forest_4", {8, 8, 8}}, {"tent_flower_forest_5", {8, 8, 8}}, {"tent_flower_forest_6", {8, 9, 8}}, {"tent_flower_forest_7", {8, 8, 8}}, {"tent_flower_forest_8", {6, 8, 8}}, {"tent_flower_forest_9", {8, 8, 8}}, {"tent_flower_forest_10", {8, 8, 8}}})},
        {"forest", makeTentPool({{"tent_forest_1", {8, 8, 8}}, {"tent_forest_2", {8, 8, 8}}, {"tent_forest_3", {6, 8, 8}}, {"tent_forest_4", {8, 8, 8}}, {"tent_forest_5", {8, 8, 8}}, {"tent_forest_6", {8, 9, 8}}, {"tent_forest_7", {8, 8, 8}}, {"tent_forest_8", {6, 8, 8}}, {"tent_forest_9", {8, 8, 8}}, {"tent_forest_10", {8, 8, 8}}})},
        {"meadow", makeTentPool({{"tent_meadow_1", {8, 8, 8}}, {"tent_meadow_2", {8, 8, 8}}, {"tent_meadow_3", {6, 8, 8}}, {"tent_meadow_4", {8, 8, 8}}, {"tent_meadow_5", {8, 8, 8}}, {"tent_meadow_6", {8, 8, 8}}, {"tent_meadow_7", {8, 8, 8}}, {"tent_meadow_8", {6, 8, 8}}, {"tent_meadow_9", {8, 8, 8}}, {"tent_meadow_10", {8, 8, 8}}})},
        {"old_growth_birch_forest", makeTentPool({{"tent_old_growth_birch_forest_1", {8, 8, 8}}, {"tent_old_growth_birch_forest_2", {8, 8, 8}}, {"tent_old_growth_birch_forest_3", {6, 8, 8}}, {"tent_old_growth_birch_forest_4", {8, 8, 8}}, {"tent_old_growth_birch_forest_5", {8, 8, 8}}, {"tent_old_growth_birch_forest_6", {8, 8, 8}}, {"tent_old_growth_birch_forest_7", {8, 8, 8}}, {"tent_old_growth_birch_forest_8", {6, 8, 8}}, {"tent_old_growth_birch_forest_9", {8, 8, 8}}, {"tent_old_growth_birch_forest_10", {8, 13, 8}}})},
        {"old_growth_pine_taiga", makeTentPool({{"tent_old_growth_pine_taiga_1", {8, 10, 8}}, {"tent_old_growth_pine_taiga_2", {8, 8, 8}}, {"tent_old_growth_pine_taiga_3", {6, 8, 8}}, {"tent_old_growth_pine_taiga_4", {8, 8, 8}}, {"tent_old_growth_pine_taiga_5", {8, 8, 8}}, {"tent_old_growth_pine_taiga_6", {8, 8, 8}}, {"tent_old_growth_pine_taiga_7", {8, 8, 8}}, {"tent_old_growth_pine_taiga_8", {6, 8, 8}}, {"tent_old_growth_pine_taiga_9", {8, 8, 8}}, {"tent_old_growth_pine_taiga_10", {8, 8, 8}}})},
        {"old_growth_spruce_taiga", makeTentPool({{"tent_old_growth_spruce_taiga_1", {8, 9, 8}}, {"tent_old_growth_spruce_taiga_2", {8, 8, 8}}, {"tent_old_growth_spruce_taiga_3", {6, 8, 8}}, {"tent_old_growth_spruce_taiga_4", {8, 8, 8}}, {"tent_old_growth_spruce_taiga_5", {8, 8, 8}}, {"tent_old_growth_spruce_taiga_6", {8, 8, 8}}, {"tent_old_growth_spruce_taiga_7", {8, 8, 8}}, {"tent_old_growth_spruce_taiga_8", {6, 8, 8}}, {"tent_old_growth_spruce_taiga_9", {8, 8, 8}}, {"tent_old_growth_spruce_taiga_10", {8, 8, 8}}})},
        {"pale_garden", makeTentPool({{"tent_pale_garden_1", {8, 8, 8}}, {"tent_pale_garden_2", {8, 8, 8}}, {"tent_pale_garden_3", {6, 8, 8}}, {"tent_pale_garden_4", {8, 8, 8}}, {"tent_pale_garden_5", {8, 8, 8}}, {"tent_pale_garden_6", {8, 8, 8}}, {"tent_pale_garden_7", {8, 8, 8}}, {"tent_pale_garden_8", {6, 8, 8}}, {"tent_pale_garden_9", {8, 8, 8}}, {"tent_pale_garden_10", {8, 8, 8}}})},
        {"savanna", makeTentPool({{"tent_savanna_1", {8, 9, 8}}, {"tent_savanna_2", {8, 8, 8}}, {"tent_savanna_3", {6, 8, 8}}, {"tent_savanna_4", {8, 8, 8}}, {"tent_savanna_5", {8, 8, 8}}, {"tent_savanna_6", {8, 8, 8}}, {"tent_savanna_7", {8, 8, 8}}, {"tent_savanna_8", {6, 8, 8}}, {"tent_savanna_9", {8, 8, 8}}, {"tent_savanna_10", {8, 8, 8}}})},
        {"snowy_taiga", makeTentPool({{"tent_snowy_taiga_1", {8, 8, 8}}, {"tent_snowy_taiga_2", {8, 8, 8}}, {"tent_snowy_taiga_3", {6, 8, 8}}, {"tent_snowy_taiga_4", {8, 8, 8}}, {"tent_snowy_taiga_5", {8, 8, 8}}, {"tent_snowy_taiga_6", {8, 8, 8}}, {"tent_snowy_taiga_7", {8, 8, 8}}, {"tent_snowy_taiga_8", {6, 8, 8}}, {"tent_snowy_taiga_9", {8, 10, 8}}, {"tent_snowy_taiga_10", {8, 12, 8}}})},
        {"sparse_jungle", makeTentPool({{"tent_sparse_jungle_1", {8, 8, 8}}, {"tent_sparse_jungle_2", {8, 10, 8}}, {"tent_sparse_jungle_3", {6, 8, 8}}, {"tent_sparse_jungle_4", {8, 8, 8}}, {"tent_sparse_jungle_5", {8, 13, 8}}, {"tent_sparse_jungle_6", {8, 8, 8}}, {"tent_sparse_jungle_7", {8, 8, 8}}, {"tent_sparse_jungle_8", {6, 8, 8}}, {"tent_sparse_jungle_9", {8, 8, 8}}, {"tent_sparse_jungle_10", {8, 8, 8}}})},
        {"swamp", makeTentPool({{"tent_swamp_1", {8, 8, 8}}, {"tent_swamp_2", {8, 8, 8}}, {"tent_swamp_3", {6, 8, 8}}, {"tent_swamp_4", {8, 10, 8}}, {"tent_swamp_5", {8, 8, 8}}, {"tent_swamp_6", {8, 8, 8}}, {"tent_swamp_7", {8, 8, 8}}, {"tent_swamp_8", {6, 8, 8}}, {"tent_swamp_9", {8, 8, 8}}, {"tent_swamp_10", {8, 8, 8}}})},
        {"taiga", makeTentPool({{"tent_taiga_1", {8, 8, 8}}, {"tent_taiga_2", {8, 9, 8}}, {"tent_taiga_3", {6, 8, 8}}, {"tent_taiga_4", {8, 8, 8}}, {"tent_taiga_5", {8, 8, 8}}, {"tent_taiga_6", {8, 8, 8}}, {"tent_taiga_7", {8, 9, 8}}, {"tent_taiga_8", {6, 10, 8}}, {"tent_taiga_9", {8, 8, 8}}, {"tent_taiga_10", {8, 8, 8}}})},
        {"windswept_forest", makeTentPool({{"tent_windswept_forest_1", {8, 8, 8}}, {"tent_windswept_forest_2", {8, 8, 8}}, {"tent_windswept_forest_3", {6, 8, 8}}, {"tent_windswept_forest_4", {8, 8, 8}}, {"tent_windswept_forest_5", {8, 8, 8}}, {"tent_windswept_forest_6", {8, 11, 8}}, {"tent_windswept_forest_7", {8, 8, 8}}, {"tent_windswept_forest_8", {6, 8, 8}}, {"tent_windswept_forest_9", {8, 8, 8}}, {"tent_windswept_forest_10", {8, 8, 8}}})},
        {"wooded_badlands", makeTentPool({{"tent_wooded_badlands_1", {8, 11, 8}}, {"tent_wooded_badlands_2", {8, 8, 8}}, {"tent_wooded_badlands_3", {6, 8, 8}}, {"tent_wooded_badlands_4", {8, 8, 8}}, {"tent_wooded_badlands_5", {8, 8, 8}}, {"tent_wooded_badlands_6", {8, 8, 8}}, {"tent_wooded_badlands_7", {8, 8, 8}}, {"tent_wooded_badlands_8", {6, 8, 8}}, {"tent_wooded_badlands_9", {8, 8, 8}}, {"tent_wooded_badlands_10", {8, 8, 8}}})},
    };
    return biomePools;
}

Generator *gGenerator = nullptr;
uint64_t gWorldSeed = 0;

const std::unordered_set<std::string> &getSecretChestSet()
{
    static const std::unordered_set<std::string> secretChestVariants = {
        "campsite_default_chest_6",
        "campsite_default_chest_7",
        "campsite_default_chest_8",
        "campsite_default_chest_9",
        "campsite_default_chest_10",
        "campsite_default_barrel_11",
        "campsite_default_barrel_12",
        "campsite_default_barrel_13",
        "campsite_default_barrel_14",
        "campsite_default_barrel_15",
        "campsite_default_special_1",
        "campsite_default_special_6",
        "campsite_default_special_8",
        "campsite_default_special_13",
        "campsite_cherry_grove_3",
        "campsite_dappled_forest_3",
        "campsite_flower_forest_2",
        "campsite_forest_3",
        "campsite_meadow_3",
        "campsite_old_growth_birch_forest_2",
        "campsite_old_growth_pine_taiga_2",
        "campsite_pale_garden_2",
        "campsite_savanna_2",
        "campsite_snowy_taiga_1",
        "campsite_sparse_jungle_2",
        "campsite_swamp_2",
        "campsite_windswept_forest_3",
        "campsite_wooded_badlands_3",
    };
    return secretChestVariants;
}

} // namespace

void initCamp(uint64_t seed)
{
    gWorldSeed = seed;
    if (gGenerator == nullptr)
    {
        gGenerator = new Generator();
        setupGenerator(gGenerator, MC_1_21_1, 0);
    }
    applySeed(gGenerator, DIM_OVERWORLD, gWorldSeed);
}

result isCamp(int rx, int rz)
{
    if (gGenerator == nullptr)
    {
        initCamp(0);
    }

    JavaRandom regionRng = makeRegionRng(gWorldSeed, rx, rz, kCampSalt);
    const int chunkX = rx * kCampSpacing + regionRng.nextInt(kCampSpacing - kCampSeparation);
    const int chunkZ = rz * kCampSpacing + regionRng.nextInt(kCampSpacing - kCampSeparation);

    JavaRandom placementRng = makePlacementRng(gWorldSeed, chunkX, chunkZ);
    const int rotation = placementRng.nextInt(4);
    const int structureIndex = placementRng.nextInt(10);
    const auto &basePool = getBiomePools();

    const std::array<int, 3> offset = rotateOffset({8, 8, 8}, rotation);
    (void)offset;

    const int x = ((chunkX * 16 + chunkX * 16 + 0) / 2) | 0;
    const int z = ((chunkZ * 16 + chunkZ * 16 + 0) / 2) | 0;

    const int biomeId = getBiomeAt(gGenerator, 4, x >> 2, 256, z >> 2);
    const char *biomeLabel = biome2str(MC_1_21_1, biomeId);
    std::string biomeName = biomeLabel != nullptr ? biomeLabel : "unknown";

    const auto biomePoolIt = std::find_if(basePool.begin(), basePool.end(), [&](const CampBiomePool &pool) {
        return pool.biomeKey == biomeName;
    });

    result out;
    out.valid = biomePoolIt != basePool.end();
    out.x = x;
    out.z = z;
    return out;
}

std::pair<int, int> campPos(int rx, int rz)
{
    if (gGenerator == nullptr)
    {
        initCamp(0);
    }

    JavaRandom regionRng = makeRegionRng(gWorldSeed, rx, rz, kCampSalt);
    const int chunkX = rx * kCampSpacing + regionRng.nextInt(kCampSpacing - kCampSeparation);
    const int chunkZ = rz * kCampSpacing + regionRng.nextInt(kCampSpacing - kCampSeparation);
    JavaRandom placementRng = makePlacementRng(gWorldSeed, chunkX, chunkZ);
    const int rotation = placementRng.nextInt(4);
    const int structureIndex = placementRng.nextInt(10);
    (void)structureIndex;

    const auto &entry = getBiomePools().front().tents.front();
    (void)entry;
    const auto offset = rotateOffset({8, 8, 8}, rotation);

    const int x = ((chunkX * 16 + chunkX * 16 + offset[0]) / 2) | 0;
    const int z = ((chunkZ * 16 + chunkZ * 16 + offset[2]) / 2) | 0;
    return {x, z};
}

std::string campVariant(int rx, int rz)
{
    if (gGenerator == nullptr)
    {
        initCamp(0);
    }

    JavaRandom regionRng = makeRegionRng(gWorldSeed, rx, rz, kCampSalt);
    const int chunkX = rx * kCampSpacing + regionRng.nextInt(kCampSpacing - kCampSeparation);
    const int chunkZ = rz * kCampSpacing + regionRng.nextInt(kCampSpacing - kCampSeparation);

    JavaRandom placementRng = makePlacementRng(gWorldSeed, chunkX, chunkZ);
    const int rotation = placementRng.nextInt(4);
    const int structureIndex = placementRng.nextInt(10);
    const auto &biomePools = getBiomePools();

    const int x = ((chunkX * 16 + chunkX * 16 + 0) / 2) | 0;
    const int z = ((chunkZ * 16 + chunkZ * 16 + 0) / 2) | 0;

    const int biomeId = getBiomeAt(gGenerator, 4, x >> 2, 256, z >> 2);
    const char *biomeLabel = biome2str(MC_1_21_1, biomeId);
    std::string biomeName = biomeLabel != nullptr ? biomeLabel : "unknown";

    const auto biomePoolIt = std::find_if(biomePools.begin(), biomePools.end(), [&](const CampBiomePool &pool) {
        return pool.biomeKey == biomeName;
    });

    if (biomePoolIt == biomePools.end())
    {
        return {};
    }

    const auto &biomePool = *biomePoolIt;
    const auto &tentEntry = biomePool.tents[structureIndex];
    (void)tentEntry;
    std::vector<std::string> variants = makeCampVariantList(false, biomePool.biomeKey);
    shuffleCampVariants(variants, placementRng);
    return variants.empty() ? std::string{} : variants.front();
}

bool hasSecretChest(const std::string &variantName)
{
    return getSecretChestSet().count(variantName) != 0;
}

