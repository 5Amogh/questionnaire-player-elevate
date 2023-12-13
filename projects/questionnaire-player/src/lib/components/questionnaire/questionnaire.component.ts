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
  }

  closeHint() {
    this.isDimmed = false;
  }
}
