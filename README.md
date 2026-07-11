# How to use

Anyone may use these files as a reference to find abandoned camp structures. Please leave credit to this library if you decide to use the files. This library works both in c++ and C language.

# Using code as reference

To use the code in another project, copy these files:

- camp.c
- camp.h
- libcubiomes.a

Then compile with these included files:

`camp.c libcubiomes.a`

Use these functions in your own project:

```c
result isCamp(int rx, int rz);
result campPos(int rx, int rz);
const char *campVariant(int rx, int rz);
bool hasSecretChest(const char *variantName);
```

isCamp takes in the region coordinates for the structure returns if the biomes check pass in that region in boolean valid, and then the world positions in x and z in the following struct:
typedef struct {
    bool valid;
    int x;
    int z;
} result;

campPos takes in the region coordinates and returns just the coordinates of the supposed camp positions without any biome checks or rotation checks in the following struct:
typedef struct {
    bool valid;
    int x;
    int z;
} result;

campVariant takes in the region coordinates then returns the exact variant name of the variant as a string pointer reference.

hasSecretChest takes in a variant name then returns if the variant has a copper chest or not as a boolean


Note this project uses the cubiomes library as a easy way to check biomes in libcubiomes.a file.
