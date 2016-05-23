import { Component, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { COMMON_DIRECTIVES } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  directives: [
    COMMON_DIRECTIVES,
  ],
})
export class BaseComp {
  constructor(
    public cdr: ChangeDetectorRef,
  ) {}
}