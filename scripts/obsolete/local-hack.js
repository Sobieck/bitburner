// evenly distribute attack against the ten 
// leave 32 gb or so for working memory

/** @param {NS} ns */
//run scripts/local-hack.js -t 2000 rothman-uni 22
export async function main(ns) {
    const target = ns.args[0];
    const securityThresh = ns.args[1];

    while(true) {
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            await ns.weaken(target);
        } else {
            await ns.grow(target);
        }
    }
}