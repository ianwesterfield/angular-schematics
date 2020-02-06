import { Rule, SchematicContext, Tree, apply, url, mergeWith, MergeStrategy, move, template, chain } from '@angular-devkit/schematics';
import { normalize, strings, experimental } from '@angular-devkit/core';
import { addDeclarationToModule, NodeDependency, NodeDependencyType } from 'schematics-utilities';
import * as helpers from '../utils/helpers';

const packageDependencies: NodeDependency[] = [
  { type: NodeDependencyType.Default, name: '@angular-devkit/core', version: '^8.2.25' },
  { type: NodeDependencyType.Default, name: '@angular/common', version: '^8.2.14' },
  { type: NodeDependencyType.Default, name: '@angular/core', version: '^8.2.14' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-buttons', version: '^5.0.0', },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-common', version: '^1.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-dateinputs', version: '^4.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-dialog', version: '^4.1.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-dropdowns', version: '^4.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-excel-export', version: '^3.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-grid', version: '^4.4.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-inputs', version: '^6.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-intl', version: '^2.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-l10n', version: '^2.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-layout', version: '^4.1.5' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-pdf-export', version: '^2.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-popup', version: '^3.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-angular-tooltip', version: '^2.1.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-data-query', version: '^1.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-drawing', version: '^1.0.0' },
  { type: NodeDependencyType.Default, name: '@progress/kendo-theme-material', version: '^3.4.0' },
];

/**
 * Main entry for the component generation schematic
 *
 * @export
 * @param {*} options
 * @returns {Rule}
 */
export function component(options: any): Rule {
  return (tree: Tree) => applySchematic(options, tree);
}

function applySchematic(options: any, tree: Tree): Rule {

  const folderPath = normalize(strings.dasherize(options.path));
  const workspace = helpers.getWorkspace(options, tree);
  let files = url('./files');

  // compose the desired file structure changes
  const updatedTree = apply(files, [
    move(folderPath),
    template({
      ...strings,
      ...options
    }),
    helpers.specFilter(options)
  ]);

  // handle non-rule transformations
  helpers.addPackageDependencies(tree, packageDependencies);

  // compose the transformation rules
  const templateRule = mergeWith(updatedTree, MergeStrategy.Default);
  const updateTargetModuleRule = updateTargetModule(options, workspace);

  // chain and apply all the rules to the working tree
  const chainedRules = chain([
    templateRule,
    updateTargetModuleRule
  ]);

  return chainedRules;
}

function updateTargetModule(options: any, workspace: experimental.workspace.WorkspaceSchema): Rule {
  return (tree: Tree, context: SchematicContext): Tree => {

    if (!options.declaringModule || options.declaringModule === '') {
      return tree;
    }

    options.project = (options.project === 'defaultProject') ? workspace.defaultProject : options.project;

    const exportedComponentName = `${strings.classify(options.name)}Component`;
    const rootModulePath = `${options.declaringModule}.module.ts`;

    const tsFile = helpers.getTsSourceFile(tree, rootModulePath);

    // stage module declare[] changes
    const changes = addDeclarationToModule(tsFile, rootModulePath, exportedComponentName, `./${options.name}.component`);

    // apply the stages changes
    const rec = tree.beginUpdate(rootModulePath);

    for (const change of (changes as any)) {
      if (change.toAdd) {
        rec.insertLeft(change.pos, change.toAdd);
      }
    }

    tree.commitUpdate(rec);
    return tree;
  }
}
