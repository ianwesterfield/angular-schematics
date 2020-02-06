import { Rule, SchematicContext, Tree, apply, url, mergeWith, MergeStrategy, move, template, chain } from '@angular-devkit/schematics';
import { normalize, strings, experimental } from '@angular-devkit/core';
import { addDeclarationToModule } from 'schematics-utilities';
import * as helpers from '../utils/helpers';

export function component(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {

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

    // compose the transformation rules
    const templateRule = mergeWith(updatedTree, MergeStrategy.Default);
    const updateTargetModuleRule = updateTargetModule(options, workspace);

    // chain and apply all the rules to the working tree
    const chainedRules = chain([templateRule, updateTargetModuleRule]);
    return chainedRules(tree, context);
  };
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
