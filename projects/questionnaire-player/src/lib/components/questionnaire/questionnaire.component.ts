import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Evidence, Question, ResponseType, Section } from '../../interfaces/questionnaire.type';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DialogComponent } from '../dialog/dialog.component';
import { QuestionnaireService } from '../../services/questionnaire.service';

@Component({
  selector: 'lib-questionnaire',
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.scss']
})
export class QuestionnaireComponent implements OnInit{
  @Input({ required: true }) questions: Array<Question>;
  evidence: Evidence;
  @Input({ required: true }) questionnaireForm: FormGroup;
  @ViewChild('dialogCmp') childDialogComponent: DialogComponent;
  @Input() questionnaireInstance = false;
  @Input() fileUploadResponse;
  @Input() qi;
  @Output() dependentParent = new EventEmitter();
  selectedIndex: number;
  dimmerIndex;
  isDimmed;

  constructor(public fb: FormBuilder, public qService: QuestionnaireService) {}

  public get reponseType(): typeof ResponseType {
    return ResponseType;
  }

  ngOnInit(): void {
    console.log('questions input',this.questions)
  }

  questionTrackBy(index, question) {
    return question._id;
  }

  openDialog(hint) {
    this.isDimmed = !this.isDimmed;
    this.childDialogComponent.hint = hint;
    this.childDialogComponent?.openDialog('300ms', '150ms');
  }

  toggleQuestion(parent) {
    this.dependentParent.emit(parent);
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

  closeHint() {
    this.isDimmed = false;
  }
}
