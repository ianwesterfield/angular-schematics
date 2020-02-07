import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { strings } from '@angular-devkit/core';
import * as path from 'path';

import * as angularJsonStub from './stubs/angular.json';
import * as appModuleStub from './stubs/app.module.json';
import * as packageJsonStub from './stubs/package.json';

const collectionPath = path.join(__dirname, '../../collection.json');
let testTree: Tree;

beforeEach(() => {
  testTree = Tree.empty();
  testTree.create('./angular.json', JSON.stringify(angularJsonStub));
  testTree.create('./package.json', JSON.stringify(packageJsonStub));
  testTree.create('./src/app/app.module.ts', JSON.stringify(appModuleStub.content));
});

describe('when component schematic', () => {

  describe('is creating files', () => {

    it('(it) creates the correct number of files', () => {
      const runner = new SchematicTestRunner('schematics', collectionPath);
      const tree = runner.runSchematic('component', { name: 'test' }, testTree);

      expect(tree.files.length).toEqual(7);
    });

    it('(it) gives files the correct names', () => {
      const nameOption = 'test';
      const runner = new SchematicTestRunner('schematics', collectionPath);
      const tree = runner.runSchematic('component', { name: nameOption }, testTree);

      tree.files.slice(3, 6).forEach((filePath: string) => {
        expect(filePath.includes(`/${nameOption}`)).toEqual(true);
      });
    });

    it('(it) creates files in the given path', () => {
      const nameOption = 'test';
      const pathOption = 'test-path';
      const runner = new SchematicTestRunner('schematics', collectionPath);
      const tree = runner.runSchematic('component', { name: nameOption, path: pathOption }, testTree);

      console.log(tree.files);

      tree.files.slice(3, 6).forEach((filePath: string) => {
        expect(filePath.startsWith(`/src/${pathOption}/`)).toEqual(true);
      });
    });

    it('(it) will not create a spec file when the spec option is false', () => {
      const nameOption = 'test';
      const specOption = 'false';
      const runner = new SchematicTestRunner('schematics', collectionPath);
      const tree = runner.runSchematic('component', { name: nameOption, spec: specOption }, testTree);
      expect(tree.files.length).toEqual(6);
    });
  });

  describe('is inserting content', () => {

    it('(it) updates template file content correctly', () => {
      const nameOption = 'test';
      const runner = new SchematicTestRunner('schematics', collectionPath);
      const tree = runner.runSchematic('component', { name: nameOption }, testTree);

      const component = tree.readContent(`./src/${nameOption}/${nameOption}.component.ts`);

      expect(component).toContain(`export class ${strings.classify(nameOption)}Component`);
    });

    it('(it) updates the package.json dependencies correctly', () => {
      const nameOption = 'test';
      const runner = new SchematicTestRunner('schematics', collectionPath);
      const tree = runner.runSchematic('component', { name: nameOption }, testTree);

      // get the dependency collection from the updated package.json as a simple string
      const file = tree.readContent(`./package.json`);
      const packageObject = JSON.parse(file);
      const collection = JSON.stringify(packageObject["dependencies"]);

      const dependencies = [
        '@angular-devkit/core',
        '@angular/animations',
        '@angular/common',
        '@angular/core',
        '@angular/forms',
        '@angular/platform-browser',
        '@progress/kendo-angular-buttons',
        '@progress/kendo-angular-common',
        '@progress/kendo-angular-dateinputs',
        '@progress/kendo-angular-dialog',
        '@progress/kendo-angular-dropdowns',
        '@progress/kendo-angular-excel-export',
        '@progress/kendo-angular-grid',
        '@progress/kendo-angular-inputs',
        '@progress/kendo-angular-intl',
        '@progress/kendo-angular-l10n',
        '@progress/kendo-angular-layout',
        '@progress/kendo-angular-pdf-export',
        '@progress/kendo-angular-popup',
        '@progress/kendo-angular-tooltip',
        '@progress/kendo-data-query',
        '@progress/kendo-drawing',
        '@progress/kendo-theme-material',
        'zone.js',
      ];

      // be sure each dependency is listed in the collection
      dependencies.forEach(dependency => expect(collection).toContain(dependency));
    });

    it('(it) adds the glob to the angular.json assets collection', () => {
      const nameOption = 'test';
      const runner = new SchematicTestRunner('schematics', collectionPath);
      const tree = runner.runSchematic('component', { name: nameOption }, testTree);
      const file = tree.readContent(`./angular.json`);
      const angularObject = JSON.parse(file);

      const assets = [
        'testing',
        {
          'glob': '**/*.css',
          'input': './node_modules/some-module',
          'output': './assets/'
        }
      ];

      const collection = angularObject["projects"]['test']['architect']['build']['options']['assets'];

      assets.forEach(asset => expect(collection).toContain(asset));
    });

    it('(it) adds the styles to the angular.json styles collection', () => {
      const nameOption = 'test';
      const runner = new SchematicTestRunner('schematics', collectionPath);
      const tree = runner.runSchematic('component', { name: nameOption }, testTree);
      const file = tree.readContent(`./angular.json`);

      const angularObject = JSON.parse(file);

      const styles = [
        'testing',
        'testing 2',
        'testing 3'
      ];

      const collection = angularObject["projects"]['test']['architect']['build']['options']['styles'];

      styles.forEach(style => expect(collection).toContain(style));
    });
  });
});