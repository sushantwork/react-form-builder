import React from 'react';
import TextAreaAutosize from 'react-textarea-autosize';
import {
  ContentState,
  EditorState,
  convertFromHTML,
  convertToRaw,
} from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { Editor } from 'react-draft-wysiwyg';
import DynamicOptionList from './dynamic-option-list';
import { get } from './stores/requests';
import ID from './UUID';

const toolbar = {
  options: ['inline', 'list', 'textAlign', 'fontSize', 'link', 'history'],
  inline: {
    inDropdown: false,
    className: undefined,
    options: ['bold', 'italic', 'underline', 'superscript', 'subscript'],
  },
};

export default class FormElementsEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      element: this.props.element,
      data: this.props.data,
      dirty: false,
      tags: this.props.element.validationRule ? this.props.element.validationRule : [],
      validation: [],
    };
  }

  removeTag = (i) => {
    const newTags = [...this.state.tags];
    newTags.splice(i, 1);
    this.setState({ tags: newTags });
  };

  inputKeyDown = (e) => {
    const val = e.target.value;
    if (e.key === 'Enter' && val) {
      if (this.state.tags.find(tag => tag.toLowerCase() === val.toLowerCase())) {
        return;
      }
      this.setState({ tags: [...this.state.tags, val] });
      this.tagInput.value = null;
    } else if (e.key === 'Backspace' && !val) {
      this.removeTag(this.state.tags.length - 1);
    }
  };

  toggleRequired() {
    // const this_element = this.state.element;
  }

  editElementProp(elemProperty, targProperty, e) {
    // elemProperty could be content or label
    // targProperty could be value or checked
    const this_element = this.state.element;
    // const this_tags= this.state.element.validationRule;
    // console.log(this_tags);
    this_element[elemProperty] = e.target[targProperty];
    this_element.validationRule = this.state.tags;
    console.log(this_element.validationRule);

    this.setState(
      {
        element: this_element,
        dirty: true,
        validation: [],
      },
      () => {
        if (targProperty === 'checked') {
          this.updateElement();
        }
      }
    );
  }

  onEditorStateChange(index, property, editorContent) {
    // const html = draftToHtml(convertToRaw(editorContent.getCurrentContent())).replace(/<p>/g, '<div>').replace(/<\/p>/g, '</div>');
    const html = draftToHtml(convertToRaw(editorContent.getCurrentContent()))
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '')
      .replace(/(?:\r\n|\r|\n)/g, ' ');
    const this_element = this.state.element;
    this_element[property] = html;

    this.setState({
      element: this_element,
      dirty: true,
    });
  }

  updateElement() {
    const this_element = this.state.element;
    // to prevent ajax calls with no change
    if (this.state.dirty) {
      this.props.updateElement.call(this.props.preview, this_element);
      this.setState({ dirty: false });
    }
  }

  convertFromHTML(content) {
    const newContent = convertFromHTML(content);
    if (!newContent.contentBlocks || !newContent.contentBlocks.length) {
      // to prevent crash when no contents in editor
      return EditorState.createEmpty();
    }
    const contentState = ContentState.createFromBlockArray(newContent);
    return EditorState.createWithContent(contentState);
  }

  addOptions() {
    const optionsApiUrl = document.getElementById('optionsApiUrl').value;
    if (optionsApiUrl) {
      get(optionsApiUrl)
        .then((data) => {
          this.props.element.options = [];
          const { options } = this.props.element;
          data.forEach((x) => {
            // eslint-disable-next-line no-param-reassign
            x.key = ID.uuid();
            options.push(x);
          });
          const this_element = this.state.element;
          this.setState({
            element: this_element,
            dirty: true,
          });
        });
    }
  }

  render() {
    const { tags } = this.state;
    if (this.state.dirty) {
      this.props.element.dirty = true;
    }

    const this_checked = this.props.element.hasOwnProperty('required')
      ? this.props.element.required
      : false;
    const this_read_only = this.props.element.hasOwnProperty('readOnly')
      ? this.props.element.readOnly
      : false;
    const this_default_today = this.props.element.hasOwnProperty('defaultToday')
      ? this.props.element.defaultToday
      : false;
    const this_show_time_select = this.props.element.hasOwnProperty(
      'showTimeSelect'
    )
      ? this.props.element.showTimeSelect
      : false;
    const this_show_time_select_only = this.props.element.hasOwnProperty(
      'showTimeSelectOnly'
    )
      ? this.props.element.showTimeSelectOnly
      : false;
    const this_checked_inline = this.props.element.hasOwnProperty('inline')
      ? this.props.element.inline
      : false;
    const this_checked_bold = this.props.element.hasOwnProperty('bold')
      ? this.props.element.bold
      : false;
    const this_checked_italic = this.props.element.hasOwnProperty('italic')
      ? this.props.element.italic
      : false;
    const this_checked_center = this.props.element.hasOwnProperty('center')
      ? this.props.element.center
      : false;
    const this_checked_page_break = this.props.element.hasOwnProperty(
      'pageBreakBefore'
    )
      ? this.props.element.pageBreakBefore
      : false;
    const this_checked_alternate_form = this.props.element.hasOwnProperty(
      'alternateForm'
    )
      ? this.props.element.alternateForm
      : false;
    const this_conditonal_rule = this.props.element.hasOwnProperty(
      'conditonalRule'
    )
      ? this.props.element.conditonalRule
      : '';
    const populateKey = this.props.element.hasOwnProperty(
      'populateKey'
    )
      ? this.props.element.populateKey
      : '';
    const this_validation_rule = this.props.element.hasOwnProperty(
      'validationRule'
    )
      ? this.props.element.validationRule
      : [];
    const {
      canHavePageBreakBefore,
      canHaveAlternateForm,
      canHaveDisplayHorizontal,
      canHaveOptionCorrect,
      canHaveOptionValue,
      canHaveVisibilityRule,
      canBeRequired,
      canEditFieldName,
    } = this.props.element;

    const this_files = this.props.files.length ? this.props.files : [];
    if (
      this_files.length < 1 ||
      (this_files.length > 0 && this_files[0].id !== '')
    ) {
      this_files.unshift({
        id: '',
        file_name: ''
      });
    }

    let editorState;
    if (this.props.element.hasOwnProperty('content')) {
      editorState = this.convertFromHTML(this.props.element.content);
    }
    if (this.props.element.hasOwnProperty('label')) {
      editorState = this.convertFromHTML(this.props.element.label);
    }
    console.log(this.props.element);

    function getContentEditor() {
      return <div className="form-group">
        <label className="control-label">Text to display:</label>

        <Editor
          toolbar={toolbar}
          defaultEditorState={editorState}
          onBlur={this.updateElement.bind(this)}
          onEditorStateChange={this.onEditorStateChange.bind(
            this,
            0,
            'content'
          )}
          stripPastedStyles={true}
        />
      </div>;
    }

    function getHrefEditor() {
      return <div className="form-group">
        <TextAreaAutosize
          type="text"
          className="form-control"
          defaultValue={this.props.element.href}
          onBlur={this.updateElement.bind(this)}
          onChange={this.editElementProp.bind(this, 'href', 'value')}
        />
      </div>;
    }

    function getFilePathEditor() {
      return <div className="form-group">
        <label className="control-label" htmlFor="fileSelect">
          Choose file:
        </label>
        <select
          id="fileSelect"
          className="form-control"
          defaultValue={this.props.element.file_path}
          onBlur={this.updateElement.bind(this)}
          onChange={this.editElementProp.bind(this, 'file_path', 'value')}
        >
          {this_files.map((file) => {
            const this_key = `file_${file.id}`;
            return (
              <option value={file.id} key={this_key}>
                {file.file_name}
              </option>
            );
          })}
        </select>
      </div>;
    }

    function getImageSrcEditor() {
      return <div>
        <div className="form-group">
          <label className="control-label" htmlFor="srcInput">
            Link to:
          </label>
          <input
            id="srcInput"
            type="text"
            className="form-control"
            defaultValue={this.props.element.src}
            onBlur={this.updateElement.bind(this)}
            onChange={this.editElementProp.bind(this, 'src', 'value')}
          />
        </div>
        <div className="form-group">
          <div className="custom-control custom-checkbox">
            <input
              id="do-center"
              className="custom-control-input"
              type="checkbox"
              checked={this_checked_center}
              value={true}
              onChange={this.editElementProp.bind(
                this,
                'center',
                'checked'
              )}
            />
            <label className="custom-control-label" htmlFor="do-center">
              Center?
            </label>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-3">
            <label className="control-label" htmlFor="elementWidth">
              Width:
            </label>
            <input
              id="elementWidth"
              type="text"
              className="form-control"
              defaultValue={this.props.element.width}
              onBlur={this.updateElement.bind(this)}
              onChange={this.editElementProp.bind(this, 'width', 'value')}
            />
          </div>
          <div className="col-sm-3">
            <label className="control-label" htmlFor="elementHeight">
              Height:
            </label>
            <input
              id="elementHeight"
              type="text"
              className="form-control"
              defaultValue={this.props.element.height}
              onBlur={this.updateElement.bind(this)}
              onChange={this.editElementProp.bind(this, 'height', 'value')}
            />
          </div>
        </div>
      </div>;
    }

    function getFieldNameEditor() {
      return <>
        {
          <div className="form-group">
            <label className="" htmlFor="field_name">Field Name (only
              alphabet, numbersand underscore. no spaces)</label>
            <input
              id="field_name"
              placeholder="fieldname (only alphabet and numbers. no spaces)"
              className="form-control"
              type="text"
              value={this.props.element.field_name}
              onChange={this.editElementProp.bind(
                this,
                'field_name',
                'value'
              )}
            />
          </div>
        }
      </>;
    }

    function getConditionalVisibilityEditor() {
      return <>
        {
          <div className="form-group">
            <label className="" htmlFor="is-conditional-rule">Conditional
              Visibility Rule</label>
            <input
              id="is-conditional-rule"
              placeholder="eg: data.type == '1'? 1: 0"
              className="form-control"
              type="text"
              value={this_conditonal_rule}
              onChange={this.editElementProp.bind(
                this,
                'conditonalRule',
                'value'
              )}
            />
          </div>
        }
      </>;
    }

    function getValidationRuleEditor() {
      return <div className="form-group">
        <label className="" htmlFor="is-conditional-rule">Validation
          Rule</label>
        {this.props.element.hasOwnProperty('validationRule') && (
          <ul className="input-tag__tags">
            {tags.map((tag, i) => (
              <li key={tag}>
                {tag}
                <button type="button" onClick={() => {
                  this.removeTag(i);
                }}>x
                </button>
              </li>
            ))}
          </ul>)}
        <input
          id="is-conditional-rule"
          placeholder="eg: data.type == '1'? 1: 0"
          className="form-control"
          type="text"
          name="validationRule[]"
          onKeyDown={this.inputKeyDown}
          ref={c => {
            this.tagInput = c;
          }}
          // value={[this.validation]}
          onChange={this.editElementProp.bind
          (
            this,
            'validationRule',
            'value',
          )
          }
        />
      </div>;
    }

    function getAutoPopulateEditor() {
      return <div className="form-group">
        <label className="" htmlFor="auto-populate-key">Auto Populate</label>
        <input id="auto-populate-key" placeholder="something" value={populateKey} onChange={this.editElementProp.bind(this, 'populateKey', 'value')}/>

        {/*<select selectedOption={this_prefix_rule} id="auto-populate-key" className="form-control" onChange={this.editElementProp.bind(*/}
        {/*  this,*/}
        {/*  'populateKey',*/}
        {/*  'selectedOption'*/}
        {/*)}>*/}
        {/*  <option selected disabled>Select data to populate</option>*/}
        {/*  <option value="account_number">Account Number</option>*/}
        {/*  <option value="account_name">Account Name</option>*/}
        {/*  <option value="mobile_number">Mobile Number</option>*/}
        {/*</select>*/}
      </div>;
    }

    function getRequiredEditor() {
      return <div className="custom-control custom-checkbox">
        <input
          id="is-required"
          className="custom-control-input"
          type="checkbox"
          checked={this_checked}
          value={true}
          onChange={this.editElementProp.bind(
            this,
            'required',
            'checked'
          )}
        />
        <label className="custom-control-label" htmlFor="is-required">
          Required
        </label>
      </div>;
    }

    function getReadOnlyEditor() {
      return <div className="custom-control custom-checkbox">
        <input
          id="is-read-only"
          className="custom-control-input"
          type="checkbox"
          checked={this_read_only}
          value={true}
          onChange={this.editElementProp.bind(
            this,
            'readOnly',
            'checked'
          )}
        />
        <label className="custom-control-label" htmlFor="is-read-only">
          Read only
        </label>
      </div>;
    }

    function getDefaultTodayEditor() {
      return <div className="custom-control custom-checkbox">
        <input
          id="is-default-to-today"
          className="custom-control-input"
          type="checkbox"
          checked={this_default_today}
          value={true}
          onChange={this.editElementProp.bind(
            this,
            'defaultToday',
            'checked'
          )}
        />
        <label
          className="custom-control-label"
          htmlFor="is-default-to-today"
        >
          Default to Today?
        </label>
      </div>;
    }

    function getTimeSelectEditor() {
      return <div className="custom-control custom-checkbox">
        <input
          id="show-time-select"
          className="custom-control-input"
          type="checkbox"
          checked={this_show_time_select}
          value={true}
          onChange={this.editElementProp.bind(
            this,
            'showTimeSelect',
            'checked'
          )}
        />
        <label
          className="custom-control-label"
          htmlFor="show-time-select"
        >
          Show Time Select?
        </label>
      </div>;
    }

    function getTimeSelectOnlyEditor() {
      return <div className="custom-control custom-checkbox">
        <input
          id="show-time-select-only"
          className="custom-control-input"
          type="checkbox"
          checked={this_show_time_select_only}
          value={true}
          onChange={this.editElementProp.bind(
            this,
            'showTimeSelectOnly',
            'checked'
          )}
        />
        <label
          className="custom-control-label"
          htmlFor="show-time-select-only"
        >
          Show Time Select Only?
        </label>
      </div>;
    }

    function getDisplayHorizontalEditor() {
      return <div className="custom-control custom-checkbox">
        <input
          id="display-horizontal"
          className="custom-control-input"
          type="checkbox"
          checked={this_checked_inline}
          value={true}
          onChange={this.editElementProp.bind(
            this,
            'inline',
            'checked'
          )}
        />
        <label
          className="custom-control-label"
          htmlFor="display-horizontal"
        >
          Display horizonal
        </label>
      </div>;
    }

    function getLabelEditor() {
      return <div className="form-group">
        <label>Display Label</label>
        <Editor
          toolbar={toolbar}
          defaultEditorState={editorState}
          onBlur={this.updateElement.bind(this)}
          onEditorStateChange={this.onEditorStateChange.bind(
            this,
            0,
            'label'
          )}
          stripPastedStyles={true}
        />
        <br/>
      </div>;
    }

    function getSignatureEditor() {
      return <div className="form-group">
        <label className="control-label" htmlFor="variableKey">
          Variable Key:
        </label>
        <input
          id="variableKey"
          type="text"
          className="form-control"
          defaultValue={this.props.element.variableKey}
          onBlur={this.updateElement.bind(this)}
          onChange={this.editElementProp.bind(this, 'variableKey', 'value')}
        />
        <p className="help-block">
          This will give the element a key that can be used to replace the
          content with a runtime value.
        </p>
      </div>;
    }

    function getPageBreakEditor() {
      return <div className="form-group">
        <label className="control-label">Print Options</label>
        <div className="custom-control custom-checkbox">
          <input
            id="page-break-before-element"
            className="custom-control-input"
            type="checkbox"
            checked={this_checked_page_break}
            value={true}
            onChange={this.editElementProp.bind(
              this,
              'pageBreakBefore',
              'checked'
            )}
          />
          <label
            className="custom-control-label"
            htmlFor="page-break-before-element"
          >
            Page Break Before Element?
          </label>
        </div>
      </div>;
    }

    function getAlternateFormEditor() {
      return <div className="form-group">
        <label className="control-label">Alternate/Signature Page</label>
        <div className="custom-control custom-checkbox">
          <input
            id="display-on-alternate"
            className="custom-control-input"
            type="checkbox"
            checked={this_checked_alternate_form}
            value={true}
            onChange={this.editElementProp.bind(
              this,
              'alternateForm',
              'checked'
            )}
          />
          <label
            className="custom-control-label"
            htmlFor="display-on-alternate"
          >
            Display on alternate/signature Page?
          </label>
        </div>
      </div>;
    }

    function getStepEditor() {
      return <div className="form-group">
        <div className="form-group-range">
          <label className="control-label" htmlFor="rangeStep">
            Step
          </label>
          <input
            id="rangeStep"
            type="number"
            className="form-control"
            defaultValue={this.props.element.step}
            onBlur={this.updateElement.bind(this)}
            onChange={this.editElementProp.bind(this, 'step', 'value')}
          />
        </div>
      </div>;
    }

    function getMinValueEditor() {
      return <div className="form-group">
        <div className="form-group-range">
          <label className="control-label" htmlFor="rangeMin">
            Min
          </label>
          <input
            id="rangeMin"
            type="number"
            className="form-control"
            defaultValue={this.props.element.min_value}
            onBlur={this.updateElement.bind(this)}
            onChange={this.editElementProp.bind(this, 'min_value', 'value')}
          />
          <input
            type="text"
            className="form-control"
            defaultValue={this.props.element.min_label}
            onBlur={this.updateElement.bind(this)}
            onChange={this.editElementProp.bind(this, 'min_label', 'value')}
          />
        </div>
      </div>;
    }

    function getMaxValueEditor() {
      return <div className="form-group">
        <div className="form-group-range">
          <label className="control-label" htmlFor="rangeMax">
            Max
          </label>
          <input
            id="rangeMax"
            type="number"
            className="form-control"
            defaultValue={this.props.element.max_value}
            onBlur={this.updateElement.bind(this)}
            onChange={this.editElementProp.bind(this, 'max_value', 'value')}
          />
          <input
            type="text"
            className="form-control"
            defaultValue={this.props.element.max_label}
            onBlur={this.updateElement.bind(this)}
            onChange={this.editElementProp.bind(this, 'max_label', 'value')}
          />
        </div>
      </div>;
    }

    function getDefaultValueEditor() {
      return <div className="form-group">
        <div className="form-group-range">
          <label className="control-label" htmlFor="defaultSelected">
            Default Selected
          </label>
          <input
            id="defaultSelected"
            type="number"
            className="form-control"
            defaultValue={this.props.element.default_value}
            onBlur={this.updateElement.bind(this)}
            onChange={this.editElementProp.bind(
              this,
              'default_value',
              'value'
            )}
          />
        </div>
      </div>;
    }

    function getTextStyleEditor() {
      return <div className="form-group">
        <label className="control-label">Text Style</label>
        <div className="custom-control custom-checkbox">
          <input
            id="do-bold"
            className="custom-control-input"
            type="checkbox"
            checked={this_checked_bold}
            value={true}
            onChange={this.editElementProp.bind(this, 'bold', 'checked')}
          />
          <label className="custom-control-label" htmlFor="do-bold">
            Bold
          </label>
        </div>
        <div className="custom-control custom-checkbox">
          <input
            id="do-italic"
            className="custom-control-input"
            type="checkbox"
            checked={this_checked_italic}
            value={true}
            onChange={this.editElementProp.bind(
              this,
              'italic',
              'checked'
            )}
          />
          <label className="custom-control-label" htmlFor="do-italic">
            Italic
          </label>
        </div>
      </div>;
    }

    function getDescriptionEditor() {
      return <div className="form-group">
        <label className="control-label" htmlFor="questionDescription">
          Description
        </label>
        <TextAreaAutosize
          type="text"
          className="form-control"
          id="questionDescription"
          defaultValue={this.props.element.description}
          onBlur={this.updateElement.bind(this)}
          onChange={this.editElementProp.bind(this, 'description', 'value')}
        />
      </div>;
    }

    function getCorrectAnswerEditor() {
      return <div className="form-group">
        <label className="control-label" htmlFor="correctAnswer">
          Correct Answer
        </label>
        <input
          id="correctAnswer"
          type="text"
          className="form-control"
          defaultValue={this.props.element.correct}
          onBlur={this.updateElement.bind(this)}
          onChange={this.editElementProp.bind(this, 'correct', 'value')}
        />
      </div>;
    }

    function getPopulateApiEditor() {
      return <div className="form-group">
        <label className="control-label" htmlFor="optionsApiUrl">
          Populate Options from API
        </label>
        <div className="row">
          <div className="col-sm-6">
            <input
              className="form-control"
              style={{ width: '100%' }}
              type="text"
              id="optionsApiUrl"
              placeholder="http://localhost:8080/api/optionsdata"
            />
          </div>
          <div className="col-sm-6">
            <button
              onClick={this.addOptions.bind(this)}
              className="btn btn-success"
            >
              Populate
            </button>
          </div>
        </div>
      </div>;
    }

    function getDynamicOptionList() {
      return <DynamicOptionList
        showCorrectColumn={this.props.showCorrectColumn}
        canHaveOptionCorrect={canHaveOptionCorrect}
        canHaveOptionValue={canHaveOptionValue}
        data={this.props.preview.state.data}
        updateElement={this.props.updateElement}
        preview={this.props.preview}
        element={this.props.element}
        key={this.props.element.options.length}
      />;
    }

    return (
      <div>
        <div className="clearfix">
          <h4 className="float-left">{this.props.element.text}</h4>
          <i
            className="float-right fas fa-times dismiss-edit"
            onClick={this.props.manualEditModeOff}
          />
        </div>

        {this.props.element.hasOwnProperty('content') && getContentEditor.call(this)}

        {this.props.element.hasOwnProperty('file_path') && getFilePathEditor.call(this)}

        {this.props.element.hasOwnProperty('href') && getHrefEditor.call(this)}

        {this.props.element.hasOwnProperty('src') && getImageSrcEditor.call(this)}

        {this.props.element.hasOwnProperty('label') && getLabelEditor.call(this)}

        {this.props.element.element === 'AutoPopulate' && getAutoPopulateEditor.call(this)}

        {this.props.element.hasOwnProperty('label') && canEditFieldName && canEditFieldName === true && getFieldNameEditor.call(this)}

        {getConditionalVisibilityEditor.call(this)}

        {this.props.element.hasOwnProperty('shouldBeValidated') && getValidationRuleEditor.call(this)}

        {this.props.element.hasOwnProperty('label') && canBeRequired && canBeRequired === true && getRequiredEditor.call(this)}


        {this.props.element.hasOwnProperty('readOnly') && getReadOnlyEditor.call(this)}
        {this.props.element.hasOwnProperty('defaultToday') && getDefaultTodayEditor.call(this)}
        {this.props.element.hasOwnProperty('showTimeSelect') && getTimeSelectEditor.call(this)}
        {this_show_time_select &&
        this.props.element.hasOwnProperty('showTimeSelectOnly') && getTimeSelectOnlyEditor.call(this)}
        {(this.state.element.element === 'RadioButtons' ||
          this.state.element.element === 'Checkboxes') &&
        canHaveDisplayHorizontal && getDisplayHorizontalEditor.call(this)}

        {this.state.element.element === 'Signature' && this.props.element.readOnly ? getSignatureEditor.call(this) : (
          <div/>)}

        {canHavePageBreakBefore && getPageBreakEditor.call(this)}

        {canHaveAlternateForm && getAlternateFormEditor.call(this)}

        {this.props.element.hasOwnProperty('step') && getStepEditor.call(this)}

        {this.props.element.hasOwnProperty('min_value') && getMinValueEditor.call(this)}

        {this.props.element.hasOwnProperty('max_value') && getMaxValueEditor.call(this)}

        {this.props.element.hasOwnProperty('default_value') && getDefaultValueEditor.call(this)}

        {this.props.element.hasOwnProperty('static') &&
        this.props.element.static && getTextStyleEditor.call(this)}

        {this.props.element.showDescription && getDescriptionEditor.call(this)}

        {this.props.showCorrectColumn &&
        this.props.element.canHaveAnswer &&
        !this.props.element.hasOwnProperty('options') && getCorrectAnswerEditor.call(this)}

        {this.props.element.canPopulateFromApi &&
        this.props.element.hasOwnProperty('options') && getPopulateApiEditor.call(this)}

        {this.props.element.hasOwnProperty('options') && getDynamicOptionList.call(this)}
      </div>
    );
  }
}
FormElementsEdit.defaultProps = { className: 'edit-element-fields' };
