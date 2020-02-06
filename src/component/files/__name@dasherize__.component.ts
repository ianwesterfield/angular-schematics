import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-<%= dasherize(name) %>',
  templateUrl: './<%= dasherize(name) %>.component.html',
  styleUrls: ['./<%= dasherize(name) %>.component.css']
})
<%# 'Component' is added inside the templating directive to avoid a breaking space with some code formatters %>
export class <%= classify(name) + 'Component' %> {
  constructor() { }
}