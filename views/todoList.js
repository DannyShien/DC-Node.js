function todoToItems(todoObject) {
    return `
        <li class="todo-list-item">
            ${todoObject.name}
        </li>
    `;
}

function todoList(arrayOfTodos) {
    const todoItems = arrayOfTodos.map(todoToItem).join('');
    return `
        <ul> 
            ${todoItemss}
        </ul>
    `;
}



module.exports = todoList;