import {
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Evidence, Question, ResponseType, Section } from '../../interfaces/questionnaire.type';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DialogComponent } from '../dialog/dialog.component';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'lib-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  @Input({ required: true }) questions: Array<Question>;
  evidence: Evidence;
  @Input({ required: true }) questionnaireForm: FormGroup;
  @ViewChild('dialogCmp') childDialogComponent: DialogComponent;
  @ViewChild('paginator') paginator: MatPaginator;
  @Input() questionnaireInstance = false;
  @Input() fileUploadResponse;
  selectedIndex: number;
  dimmerIndex;
  isDimmed;

  pageSize = 1; //Each Question object from Question representing each page irrespective of number of questions it includes
  pageIndex = 0;
  hidePageSize = true;
  showFirstLastButtons = true;
  disabled = false;

  paginatorLength: number;

  constructor(public fb: FormBuilder, public qService: QuestionnaireService) {}

  public get reponseType(): typeof ResponseType {
    return ResponseType;
  }

  ngOnInit(): void {
    this.paginatorLength = this.questions.length;
  }

  handlePageEvent(e: PageEvent) {
    if (this.questions[e.pageIndex] && !this.findNextVisibleQuestion(e.pageIndex, this.pageIndex)) {
      this.paginator.pageIndex = this.pageIndex;
      this.paginatorLength = this.pageIndex +1;
    }
  }

  private findNextVisibleQuestion(eventPageIndex: number, currentPageIndex: number): boolean {
    let step = 1;
    let endIndex = this.questions.length;
    if (currentPageIndex > eventPageIndex) {
      endIndex = 0;
      step = -1;
    }
    for (let i = eventPageIndex; this.questions[i]; i += step) {
      console.log('question',this.questions[i])
      if (Array.isArray(this.questions[i].visibleIf) && this.questions[i].canDisplay
        || !Array.isArray(this.questions[i].visibleIf)) {
        console.log('found the next one', this.questions[i])
        this.pageIndex = i;
        this.paginator.pageIndex = i;
        return true;
      }
    }
    return false;
  }

  toggleQuestion(parent) {
    const { children } = parent;
    console.log('children',children)
    this.questions.map((q, i) => {
      if (children.includes(q._id)) {
        let child = this.questions[i];
        child['canDisplay'] = this.canDisplayChildQ(child, i);
        console.log('can this child be displayed',child['canDisplay'])
        if (child['canDisplay'] == false) {
          child.value = '';
          this.questionnaireForm.removeControl(child._id);
        }
      }
    });
  }

  canDisplayChildQ(currentQuestion: Question, currentQuestionIndex: number) {
    let display = true;
    if (typeof currentQuestion.visibleIf == 'string' || null || undefined) {
      return false; //if condition not present
    }
    for (const question of this.questions) {
      for (const condition of currentQuestion.visibleIf) {
        if (condition._id === question._id) {
          let expression = [];
          if (condition.operator != '===') {
            if (question.responseType === 'multiselect') {
              for (const parentValue of question.value) {
                for (const value of condition.value) {
                  expression.push(
                    '(',
                    "'" + parentValue + "'",
                    '===',
                    "'" + value + "'",
                    ')',
                    condition.operator
                  );
                }
              }
            } else {
              for (const value of condition.value) {
                expression.push(
                  '(',
                  "'" + question.value + "'",
                  '===',
                  "'" + value + "'",
                  ')',
                  condition.operator
                );
              }
            }
            expression.pop();
          } else {
            if (question.responseType === 'multiselect') {
              for (const value of question.value) {
                expression.push(
                  '(',
                  "'" + condition.value + "'",
                  '===',
                  "'" + value + "'",
                  ')',
                  '||'
                );
              }
              expression.pop();
            } else {
              expression.push(
                '(',
                "'" + question.value + "'",
                condition.operator,
                "'" + condition.value + "'",
                ')'
              );
            }
          }
          if (!eval(expression.join(''))) {
            this.questions[currentQuestionIndex].isCompleted = true;
            return false;
          } else {
            // this.questions[currentQuestionIndex].isCompleted =
            //   this.utils.isQuestionComplete(currentQuestion);
          }
        }
      }
    }
    return display;
  }

}
