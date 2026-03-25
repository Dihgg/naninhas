
import { Traits } from "@shared/components/Traits";

/**
 * Initialize Traits for both Build 41 and Build 42
 * The Traits class uses TraitRegister which gracefully handles both builds:
 * - Build 41: Registers traits dynamically
 * - Build 42: Uses trait definitions from .txt files (no-op in register)
 */
new Traits();
