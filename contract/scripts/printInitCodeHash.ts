import { buildInitCodeHash } from "../test/shop-addr-helper";

/**
 * Prints the init hash code to fill it into the env variables to shortcut contract calculation
 * without requiring the whole contract (maybe think about also automatic replacement).
 */
async function main() {
  console.log('W3Shop Init Code Hash: ' + await buildInitCodeHash());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
