import { Tree, SchematicsException, Rule, filter } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { experimental } from '@angular-devkit/core';

/**
 * Gets the provided file as a TypeScript source object.
 *
 * @export
 * @param {Tree} tree The working file structure
 * @param {string} path The path to the file to be parsed
 * @returns {ts.SourceFile}
 */
export function getTsSourceFile(tree: Tree, path: string): ts.SourceFile {
  const file = tree.read(path);

  if (!file) {
    throw new SchematicsException(`${path} not found`);
  }

  return ts.createSourceFile(path, file.toString(), ts.ScriptTarget.Latest, true);
}

/**
 * Gets the workspace for the working directory angular.json file.
 *
 * @export
 * @param {*} options The options for the running schema operation
 * @param {Tree} tree The working file structure
 * @returns {experimental.workspace.WorkspaceSchema}
 */
export function getWorkspace(options: any, tree: Tree): experimental.workspace.WorkspaceSchema {
  const workspace = tree.read('/angular.json');

  if (!workspace) {
    throw new SchematicsException('angular.json file not found in root of project!');
  }

  return JSON.parse(workspace.toString());
}

/**
 * Prevents outputting .spec files if --spec=false
 *
 * @param {*} options The options for the running schema operation
 * @returns {Rule} The Rule to apply to the working file structure
 */
export function specFilter(options: any): Rule {
  if (options.spec === 'false') {
    return filter(path => {
      return !path.match(/\.spec\.ts$/) && !path.match(/test\.ts$/);
    })
  }

  return filter(path => !path.match(/test\.ts$/));
}