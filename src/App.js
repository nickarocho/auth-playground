/* src/App.js */
import React, { useEffect, useState } from "react";
import Amplify, { DataStore } from "aws-amplify";
import { Todo } from "./models";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import awsExports from "./aws-exports";
Amplify.configure(awsExports);

const initialState = { name: "", description: "" };

function App({ signOut, user }) {
  const [formState, setFormState] = useState(initialState);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const todoSubscription = DataStore.observe(Todo).subscribe(async () => {
      try {
        fetchTodos();
      } catch (err) {
        console.log("oh noooo");
      }
    });
    fetchTodos();

    return () => {
      todoSubscription.unsubscribe();
    };
  }, []);

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }

  async function fetchTodos() {
    try {
      const todos = await DataStore.query(Todo);
      setTodos(todos);
    } catch (err) {
      console.error("error fetching todos", err);
    }
  }

  async function clearTodos() {
    await DataStore.clear();
    fetchTodos();
  }

  async function deleteTodo(id) {
    const todelete = await DataStore.query(Todo, id);
    DataStore.delete(todelete);
    console.log({ todelete });
    fetchTodos();
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return;
      const todo = { ...formState };
      setTodos([...todos, todo]);
      setFormState(initialState);
      await DataStore.save(new Todo(todo));
    } catch (err) {
      console.error("error creating todo:", err);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <button style={styles.button} onClick={signOut}>
          Sign out
        </button>
        <button style={styles.button} onClick={clearTodos}>
          Clear
        </button>
      </div>
      <br />
      <h2>Amplify Todos</h2>
      <input
        onChange={(event) => setInput("name", event.target.value)}
        style={styles.input}
        value={formState.name}
        placeholder="Name"
      />
      <input
        onChange={(event) => setInput("description", event.target.value)}
        style={styles.input}
        value={formState.description}
        placeholder="Description"
      />
      <button style={styles.button} onClick={addTodo}>
        Create Todo
      </button>
      {todos.map((todo, index) => (
        <div key={todo.id ? todo.id : index} style={styles.todo}>
          <p style={styles.todoName}>{todo.name}</p>
          <p style={styles.todoDescription}>{todo.description}</p>
          <a
            href="#delete"
            data-todoid={todo.id}
            onClick={() => deleteTodo(todo.id)}
            style={styles.todoDelete}
          >
            Delete
          </a>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    width: 400,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "20vh 0",
    margin: "0 auto",
    minHeight: "100vh",
  },
  todo: { marginBottom: 15 },
  input: {
    border: "none",
    backgroundColor: "#ddd",
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  todoName: { fontSize: 20, fontWeight: "bold" },
  todoDescription: { marginBottom: 0 },
  todoDelete: {
    fontSize: ".7rem",
    textDecoration: "none",
    textTransform: "uppercase",
    cursor: "pointer",
    color: "red",
    fontWeight: 700,
  },
  button: {
    backgroundColor: "black",
    color: "white",
    outline: "none",
    fontSize: 18,
    padding: "12px 0px",
    width: "100%",
  },
  row: { display: "flex", justifyContent: "space-between" },
};

export default withAuthenticator(App);
