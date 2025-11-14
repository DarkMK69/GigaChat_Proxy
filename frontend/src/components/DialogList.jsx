import React from 'react';

const DialogList = ({ dialogs, currentDialog, onSwitchDialog }) => {
  const getLastMessage = (dialog) => {
    const lastMessage = dialog.messages[dialog.messages.length - 1];
    return lastMessage ? 
      (lastMessage.content.substring(0, 30) + (lastMessage.content.length > 30 ? '...' : '')) 
      : 'Нет сообщений';
  };

  return (
    <div className="dialog-list">
      <h3>Диалоги</h3>
      {dialogs.map(dialog => (
        <div
          key={dialog.id}
          className={`dialog-item ${currentDialog?.id === dialog.id ? 'active' : ''}`}
          onClick={() => onSwitchDialog(dialog)}
        >
          <div className="dialog-name">{dialog.name}</div>
          <div className="dialog-preview">
            {getLastMessage(dialog)}
          </div>
          <div className="dialog-info">
            {dialog.messages.length} сообщений
          </div>
        </div>
      ))}
    </div>
  );
};

export default DialogList;