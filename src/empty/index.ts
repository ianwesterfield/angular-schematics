import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function empty(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => tree;
}
