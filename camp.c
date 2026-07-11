#include "camp.h"

#include "cubiomes/generator.h"
#include "cubiomes/util.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CAMP_SPACING 34
#define CAMP_SEPARATION 8
#define CAMP_SALT 91231127
#define MASK48 ((1ULL << 48) - 1ULL)
#define JAVA_MULTIPLIER 0x5DEECE66DULL
#define JAVA_ADDEND 0xBULL

typedef struct {
    uint64_t state;
} JavaRandom;

typedef struct {
    const char *biomeKey;
} CampBiomePool;

static Generator *g_generator = NULL;
static uint64_t g_world_seed = 0;

static void java_random_set_seed(JavaRandom *rng, uint64_t seed)
{
    rng->state = (seed ^ JAVA_MULTIPLIER) & MASK48;
}

static uint32_t java_random_next_bits(JavaRandom *rng, int bits)
{
    rng->state = (rng->state * JAVA_MULTIPLIER + JAVA_ADDEND) & MASK48;
    return (uint32_t)((rng->state >> (48 - bits)) & ((1ULL << bits) - 1ULL));
}

static int java_random_next_int(JavaRandom *rng, int bound)
{
    if (bound <= 0)
    {
        return 0;
    }
    if ((bound & -bound) == bound)
    {
        const uint32_t bits = java_random_next_bits(rng, 31);
        return (int)((uint64_t)bound * (uint64_t)bits >> 31);
    }

    int bits;
    int value;
    do
    {
        bits = java_random_next_bits(rng, 31);
        value = bits % bound;
    } while ((bits - value + (bound - 1)) < 0);
    return value;
}

static uint64_t java_random_next_long(JavaRandom *rng)
{
    const int32_t hi = (int32_t)java_random_next_bits(rng, 32);
    const int32_t lo = (int32_t)java_random_next_bits(rng, 32);
    return (uint64_t)(((int64_t)hi << 32) + (int64_t)lo);
}

static JavaRandom make_region_rng(uint64_t worldSeed, int regX, int regZ, int32_t salt)
{
    int64_t seed64 = (int64_t)regX * 341873128712LL;
    seed64 += (int64_t)regZ * 132897987541LL;
    seed64 += (int64_t)worldSeed + (int64_t)salt;
    JavaRandom rng;
    java_random_set_seed(&rng, (uint64_t)seed64 & MASK48);
    return rng;
}

static JavaRandom make_placement_rng(uint64_t worldSeed, int chunkX, int chunkZ)
{
    JavaRandom base;
    java_random_set_seed(&base, worldSeed);
    int64_t a = (int64_t)chunkX * (int64_t)java_random_next_long(&base);
    int64_t c = (int64_t)chunkZ * (int64_t)java_random_next_long(&base);
    JavaRandom rng;
    java_random_set_seed(&rng, (uint64_t)((a ^ c ^ (int64_t)worldSeed) & (int64_t)MASK48));
    return rng;
}

static void rotate_offset(int sizeX, int sizeY, int sizeZ, int rotation, int *outX, int *outY, int *outZ)
{
    const int x = sizeX - 1;
    const int y = sizeY - 1;
    const int z = sizeZ - 1;

    switch (rotation)
    {
    case 0:
        *outX = x;
        *outY = y;
        *outZ = z;
        break;
    case 1:
        *outX = -z;
        *outY = y;
        *outZ = x;
        break;
    case 2:
        *outX = -x;
        *outY = y;
        *outZ = -z;
        break;
    case 3:
    default:
        *outX = z;
        *outY = y;
        *outZ = -x;
        break;
    }
}

static int is_supported_biome(const char *biomeName)
{
    static const char *const supported[] = {
        "bamboo_jungle",
        "birch_forest",
        "cherry_grove",
        "dappled_forest",
        "flower_forest",
        "forest",
        "meadow",
        "old_growth_birch_forest",
        "old_growth_pine_taiga",
        "old_growth_spruce_taiga",
        "pale_garden",
        "savanna",
        "snowy_taiga",
        "sparse_jungle",
        "swamp",
        "taiga",
        "windswept_forest",
        "wooded_badlands",
    };
    size_t i;
    for (i = 0; i < sizeof(supported) / sizeof(supported[0]); ++i)
    {
        if (strcmp(biomeName, supported[i]) == 0)
        {
            return 1;
        }
    }
    return 0;
}

static void make_variant_list(const char *biomeKey, const char **out, size_t *count)
{
    size_t n = 0;
    int i;

    for (i = 0; i < 15; ++i)
    {
        char name[64];
        snprintf(name, sizeof(name), "campsite_default_chest_%d", i + 1);
        out[n++] = strdup(name);
    }
    for (i = 0; i < 15; ++i)
    {
        char name[64];
        snprintf(name, sizeof(name), "campsite_default_barrel_%d", i + 1);
        out[n++] = strdup(name);
    }
    for (i = 0; i < 15; ++i)
    {
        char name[64];
        snprintf(name, sizeof(name), "campsite_default_special_%d", i + 1);
        out[n++] = strdup(name);
    }
    for (i = 0; i < 3; ++i)
    {
        char name[64];
        snprintf(name, sizeof(name), "campsite_%s_%d", biomeKey, i + 1);
        out[n++] = strdup(name);
    }
    *count = n;
}

static void shuffle_variants(const char **variants, size_t count, JavaRandom *rng)
{
    size_t i;
    for (i = count; i > 1; --i)
    {
        const int index = java_random_next_int(rng, (int)i);
        const char *tmp = variants[index];
        variants[index] = variants[i - 1];
        variants[i - 1] = tmp;
    }
}

static void free_variant_list(char **variants, size_t count)
{
    size_t i;
    for (i = 0; i < count; ++i)
    {
        free(variants[i]);
    }
}

void initCamp(uint64_t seed)
{
    g_world_seed = seed;
    if (g_generator == NULL)
    {
        g_generator = (Generator *)malloc(sizeof(Generator));
        setupGenerator(g_generator, MC_1_21_1, 0);
    }
    applySeed(g_generator, DIM_OVERWORLD, g_world_seed);
}

result isCamp(int rx, int rz)
{
    result out;
    out.valid = 0;
    out.x = 0;
    out.z = 0;

    if (g_generator == NULL)
    {
        initCamp(0);
    }

    JavaRandom regionRng = make_region_rng(g_world_seed, rx, rz, CAMP_SALT);
    const int chunkX = rx * CAMP_SPACING + java_random_next_int(&regionRng, CAMP_SPACING - CAMP_SEPARATION);
    const int chunkZ = rz * CAMP_SPACING + java_random_next_int(&regionRng, CAMP_SPACING - CAMP_SEPARATION);

    JavaRandom placementRng = make_placement_rng(g_world_seed, chunkX, chunkZ);
    (void)placementRng;

    const int x = ((chunkX * 16 + chunkX * 16) / 2) | 0;
    const int z = ((chunkZ * 16 + chunkZ * 16) / 2) | 0;

    const int biomeId = getBiomeAt(g_generator, 4, x >> 2, 256, z >> 2);
    const char *biomeLabel = biome2str(MC_1_21_1, biomeId);
    const char *biomeName = biomeLabel != NULL ? biomeLabel : "unknown";

    if (is_supported_biome(biomeName))
    {
        out.valid = 1;
        out.x = x;
        out.z = z;
    }
    return out;
}

result campPos(int rx, int rz)
{
    result out;
    out.valid = 1;
    out.x = 0;
    out.z = 0;

    if (g_generator == NULL)
    {
        initCamp(0);
    }

    JavaRandom regionRng = make_region_rng(g_world_seed, rx, rz, CAMP_SALT);
    const int chunkX = rx * CAMP_SPACING + java_random_next_int(&regionRng, CAMP_SPACING - CAMP_SEPARATION);
    const int chunkZ = rz * CAMP_SPACING + java_random_next_int(&regionRng, CAMP_SPACING - CAMP_SEPARATION);

    JavaRandom placementRng = make_placement_rng(g_world_seed, chunkX, chunkZ);
    int offsetX = 0;
    int offsetY = 0;
    int offsetZ = 0;
    rotate_offset(8, 8, 8, java_random_next_int(&placementRng, 4), &offsetX, &offsetY, &offsetZ);

    out.x = ((chunkX * 16 + chunkX * 16 + offsetX) / 2) | 0;
    out.z = ((chunkZ * 16 + chunkZ * 16 + offsetZ) / 2) | 0;
    return out;
}

const char *campVariant(int rx, int rz)
{
    static char variantBuffer[128];
    static const char *lastVariant = "";

    if (g_generator == NULL)
    {
        initCamp(0);
    }

    JavaRandom regionRng = make_region_rng(g_world_seed, rx, rz, CAMP_SALT);
    const int chunkX = rx * CAMP_SPACING + java_random_next_int(&regionRng, CAMP_SPACING - CAMP_SEPARATION);
    const int chunkZ = rz * CAMP_SPACING + java_random_next_int(&regionRng, CAMP_SPACING - CAMP_SEPARATION);

    JavaRandom placementRng = make_placement_rng(g_world_seed, chunkX, chunkZ);
    (void)java_random_next_int(&placementRng, 4);
    (void)java_random_next_int(&placementRng, 10);

    const int biomeId = getBiomeAt(g_generator, 4, ((chunkX * 16 + chunkX * 16) / 2) >> 2, 256, ((chunkZ * 16 + chunkZ * 16) / 2) >> 2);
    const char *biomeLabel = biome2str(MC_1_21_1, biomeId);
    const char *biomeName = biomeLabel != NULL ? biomeLabel : "unknown";

    if (!is_supported_biome(biomeName))
    {
        variantBuffer[0] = '\0';
        lastVariant = variantBuffer;
        return lastVariant;
    }

    const char *variants[48];
    size_t count = 0;
    make_variant_list(biomeName, variants, &count);
    shuffle_variants(variants, count, &placementRng);

    snprintf(variantBuffer, sizeof(variantBuffer), "%s", variants[0]);
    lastVariant = variantBuffer;
    free_variant_list((char **)variants, count);
    return lastVariant;
}

bool hasSecretChest(const char *variantName)
{
    static const char *const secretChestVariants[] = {
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
    size_t i;
    for (i = 0; i < sizeof(secretChestVariants) / sizeof(secretChestVariants[0]); ++i)
    {
        if (strcmp(variantName, secretChestVariants[i]) == 0)
        {
            return true;
        }
    }
    return false;
}
