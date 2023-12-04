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
export class MainComponent implements OnInit{
  @Input({ required: true }) questions: Array<Question>;
  evidence: Evidence;
  @Input({ required: true }) questionnaireForm: FormGroup;
  @ViewChild('dialogCmp') childDialogComponent: DialogComponent;
  @ViewChild('paginator') paginator:MatPaginator;
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

  pageEvent:PageEvent;
  paginatorMap = new Map();
  paginatorLength:number;

  constructor(public fb: FormBuilder, public qService: QuestionnaireService) {}

  public get reponseType(): typeof ResponseType {
    return ResponseType;
  }

  ngOnInit(): void {
    this.questions.map(question => {
      if ((typeof question.visibleIf == 'string' || null || undefined) && !this.questionnaireInstance) {
        console.log(question)
        // this.paginatorMap.set(question._id,true)
        question['canDisplay'] = true;
      }
    })
    // if(!this.questionnaireInstance){
    //   console.log(this.paginatorMap)
    //   this.paginatorLength = this.paginatorMap.size;
    // }
  }

  handlePageEvent(e:PageEvent){
    const currentPage = this.pageIndex;
    this.pageEvent = e;
    this.pageIndex = e.pageIndex;
    console.log('page event',e)
    let foundNextVisibleQuestion = false;
    if(this.questions[e.pageIndex] && !this.questions[e.pageIndex].canDisplay){
      for(let i= 0; i < this.questions.length; i++){
        if(this.questions[i].canDisplay){
          this.pageIndex = i;
          this.paginator.pageIndex = i;
          this.showFirstLastButtons = true;
          foundNextVisibleQuestion = true;
          break;
        }
      }
      if(!foundNextVisibleQuestion){
        this.pageIndex = currentPage;
        this.paginator.pageIndex = currentPage;
        this.showFirstLastButtons = false;
        console.log('page event',e)
      }
    }
  }

  questionTrackBy(index, question) {
    return question._id;
  }

  openDialog(hint) {
    // this.dimmerIndex = questionIndex;
    this.isDimmed = !this.isDimmed;
    this.childDialogComponent.hint = hint;
    this.childDialogComponent?.openDialog('300ms', '150ms');
  }

  toggleQuestion(parent) {
    const { children } = parent;

    this.questions.map((q, i) => {
      if (children.includes(q._id)) {
        let child = this.questions[i];
        child['canDisplay'] = this.canDisplayChildQ(child, i);
        console.log(child);

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

  closeHint() {
    this.isDimmed = false;
  }
}
