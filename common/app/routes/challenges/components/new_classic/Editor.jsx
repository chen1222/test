import { Subject } from 'rx';
import React, { PropTypes } from 'react';
import { createSelector } from 'reselect';
import { connect } from 'react-redux';
import PureComponent from 'react-pure-render/component';
import MouseTrap from 'mousetrap';

const mapStateToProps = createSelector(
  state => state.app.windowHeight,
  state => state.app.navHeight,
  (windowHeight, navHeight) => ({ height: windowHeight - navHeight - 50 })
);

const editorDebounceTimeout = 750;

export class Editor extends PureComponent {
  constructor(props) {
    super(props);
    this._editorContent$ = new Subject();
    this.handleChange = this.handleChange.bind(this);
    this.preventPaste = this.preventPaste.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.tabHandler = this.tabHandler.bind(this);

    this.state = {
      content: this.props.content
    };
  }
  static displayName = 'Editor';
  static propTypes = {
    executeChallenge: PropTypes.func,
    height: PropTypes.number,
    content: PropTypes.array,
    id: PropTypes.string,
    isSource: PropTypes.bool,
    mode: PropTypes.string,
    updateFile: PropTypes.func,
    onChange: PropTypes.func
  };

  static defaultProps = {
    content: '',
    mode: 'javascript'
  };

  componentDidMount() {
    const { updateFile = (() => { }) } = this.props;
    this._subscription = this._editorContent$
      .debounce(editorDebounceTimeout)
      .distinctUntilChanged()
      .subscribe(
      updateFile,
      err => { throw err; }
      );

    MouseTrap.bind('e', () => {
      this.refs.editor.focus();
    }, 'keyup');
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      content: ''
    }, () => {
      this.setState({
        content: nextProps.content
      });
    });
  }
  componentWillUnmount() {
    if (this._subscription) {
      this._subscription.dispose();
      this._subscription = null;
    }
    MouseTrap.unbind('e', 'keyup');
  }

  handleChange(e) {
    // console.log(this.textInput.innerHTML, 'diff');
    var content1 = this.textInput.innerHTML
      .replace(/<br><\/div>/g, '</div>')
      .replace(/(<div><br><div>)|(<br><div>)|(<div><br>)/g, '<div>')
      .replace(/<(div|p)[^<]*?>/g, '\n').replace(/<(\/(div|p)[^<]*?>)|(<div><\/div>)/g, '')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/<span style="color: red;">|<\/span>/g, '')
      .replace(/<br>/g, '\n')
      .replace(/<!-- react-text.*\-->/g, '')
      .replace(/<!-- \/react-text -->/g, '');

    this.props.onChange(content1);
  }

  getContent() {
    var content = this.textInput.innerHTML.replace(/<(div|p|br)[^<]*?>/g, '\n').replace(/<\/(div|p|br)[^<]*?>/g, '').replace(/<([(i|a|b|u)^>]+)>(.*?)<\/\1>/gim,
      function (v) { return '' + escape(v) + ''; }).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
      .replace(/<span style="color: red;">|<\/span>/g, '');

    return content;
  }

  tabHandler(e) {
    if (e.keyCode === 9) {
      e.preventDefault();

      var editor = this.textInput;
      var doc = editor.ownerDocument.defaultView;
      var sel = doc.getSelection();
      var range = sel.getRangeAt(0);

      var tabNode = document.createTextNode("\u00a0\u00a0\u00a0\u00a0");
      range.insertNode(tabNode);

      range.setStartAfter(tabNode);
      range.setEndAfter(tabNode);
      sel.removeAllRanges();
      sel.addRange(range);            
    }
  }

  preventPaste(e) {
    e.preventDefault();
  }

  render() {
    var {id, isSource } = this.props;

    return (
      <div
        className='challenges-editor col-md-12'
        contentEditable={!isSource}
        id={id}
        onKeyDown={this.tabHandler}
        onKeyUp={this.handleChange}
        onPaste={this.preventPaste}
        ref={(input) => { this.textInput = input; }}
        spellCheck='false'
        wrap='off'
      >
        {this.state.content}
      </div>
    );
  }
}

export default connect(mapStateToProps)(Editor);
