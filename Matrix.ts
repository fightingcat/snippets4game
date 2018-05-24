type vec2 = [number, number];
type vec3 = [number, number, number];
type mat2 = [number, number, number, number];
type mat3 = [number, number, number, number, number, number, number, number, number];

function vec2(x: number, y: number): vec2 {
    return [x, y];
}

function vec3(x: number, y: number, z: number): vec3 {
    return [x, y, z];
}

function mulVec2Mat2(vec2: vec2, mat2: mat2): vec2 {
    const [x, y] = vec2;
    const [a, b, c, d] = mat2;

    vec2[0] = x * a + y * c;
    vec2[1] = x * b + y * d;

    return vec2;
}

function mulVec3Mat3(vec3: vec3, mat3: mat3) {
    const [x, y, z] = vec3;
    const [a, b, c, d, e, f, g, h, i] = mat3;

    vec3[0] = x * a + y * d + z * g;
    vec3[1] = x * b + y * e + z * h;
    vec3[2] = x * c + y * f + z * i;

    return vec3;
}

function mulMat2Mat2(left: mat2, right: mat3): mat2 {
    const [a1, b1, c1, d1] = left;
    const [a2, b2, c2, d2] = right;

    left[0] = a1 * a2 + b1 * c1;
    left[1] = a1 * b2 + b1 * d2;

    left[2] = c1 * a2 + d1 * c2;
    left[3] = c1 * b2 + d1 * d2;

    return left;
}

function mulMat3Mat3(left: mat3, right: mat3): mat3 {
    const [a1, b1, c1, d1, e1, f1, g1, h1, i1] = left;
    const [a2, b2, c2, d2, e2, f2, g2, h2, i2] = right;

    left[0] = a1 * a2 + b1 * d2 + c1 * g2;
    left[1] = a1 * b2 + b1 * e2 + c1 * h2;
    left[2] = a1 * c2 + b1 * f2 + c1 * i2;

    left[3] = d1 * a2 + e1 * d2 + f1 * g2;
    left[4] = d1 * b2 + e1 * e2 + f1 * h2;
    left[5] = d1 * c2 + e1 * f2 + f1 * i2;

    left[6] = g1 * a2 + h1 * d2 + i1 * g2;
    left[7] = g1 * b2 + h1 * e2 + i1 * h2;
    left[8] = g1 * c2 + h1 * f2 + i1 * i2;

    return left;
}
