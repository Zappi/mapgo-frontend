import * as React from 'react';

class Modal extends React.Component {
    render() {
        return (
            <div className="app-modal">
                {this.props.children}
            </div>
        );
    }
}

export default Modal;