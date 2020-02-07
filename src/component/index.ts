import { addDeclarationToModule, NodeDependency, NodeDependencyType } from 'schematics-utilities';
import { normalize, strings, experimental } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree, apply, url, mergeWith, MergeStrategy, move, template, chain } from '@angular-devkit/schematics';
import * as helpers from '../utils/helpers';
import * as _ from 'lodash';

const packageDependencies: NodeDependency[] = [
  { type: NodeDependencyType.Default, name: '@angular-devkit/core', version: '^8.2.25' },
  { type: NodeDependencyType.Default, name: '@angular/animations', version: '^8.2.14' },
  { type: NodeDependencyType.Default, name: '@angular/common', version: '^8.2.14' },
  { type: NodeDependencyType.Default, name: '@angular/core', version: '^8.2.14' },
  { type: NodeDependencyType.Default, name: '@angular/forms', version: '^8.2.14' },
  { type: NodeDependencyType.Default, name: '@angular/platform-browser', version: '^8.2.14' },
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
  { type: NodeDependencyType.Default, name: 'zone.js', version: '~0.9.1' },
];

const packageStyles: any[] = [
  "testing",
  "testing 2",
  "testing 3"
];

const packageAssets: any[] = [
  "testing",
  {
    "glob": "**/*.css",
    "input": "./node_modules/some-module",
    "output": "./assets/"
  }
]

/**
 * Main entry for the component generation schematic
 *
 * @export
 * @param {*} options
 * @returns {Rule}
 */
export function component(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => applySchematic(options, tree, context);
}

function applySchematic(options: any, tree: Tree, context: SchematicContext): Rule {
  const folderPath = normalize(strings.dasherize(options.path));
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
  helpers.addPackageDependencies(context, tree, packageDependencies);

  // stage the transformation rules
  const templateRule = mergeWith(updatedTree, MergeStrategy.Default);
  const updateTargetModuleRule = updateTargetModule(options);
  const workspaceAssetsUpdate = updateWorkspaceBuildOptionCollection(BuildOptionCollectionType.ASSETS, packageAssets);
  const workspaceStylesUpdate = updateWorkspaceBuildOptionCollection(BuildOptionCollectionType.STYLES, packageStyles);

  // chain and apply all the rules to the working tree
  const chainedRules = chain([
    templateRule,
    updateTargetModuleRule,
    workspaceAssetsUpdate,
    workspaceStylesUpdate
  ]);

  return chainedRules;
}

function updateTargetModule(options: any): Rule {
  return (tree: Tree): Tree => {

    if (!options.module || options.module === '') {
      return tree;
    }

    const workspace = helpers.getWorkspace(tree);

    if (!workspace) {
      return tree;
    }

    options.project = (options.project === 'defaultProject') ? workspace.defaultProject : options.project;

    const exportedComponentName = `${strings.classify(options.name)}Component`;
    const rootModulePath = `${options.module}.module.ts`;
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

function updateWorkspaceBuildOptionCollection(type: BuildOptionCollectionType, collection: any[]): Rule {
  return (tree: Tree) => {
    const workspace = helpers.getWorkspace(tree);

    if (!workspace) {
      return;
    }

    // get the existing array
    const project: string = Object.keys(workspace['projects'])[0];
    const projectObject = workspace.projects[project];
    let existingArray = projectObject.architect.build.options[type] as string[];

    // update the existing array
    const updatedArray = helpers.mergeDedupe([existingArray, collection]);
    const uniqueArray = _.uniqWith(updatedArray, _.isEqual);
    existingArray.splice(0);
    existingArray.push(...uniqueArray);

    // commit the changes
    tree.overwrite('angular.json', JSON.stringify(workspace, null, 2));
  }
}

const enum BuildOptionCollectionType {
  ASSETS = 'assets',
  STYLES = 'styles',
  SCRIPTS = 'scripts'
}