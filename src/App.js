import React, { useEffect, useState } from "react";
import Amplify, { DataStore } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { Todo } from "./models";
import "@aws-amplify/ui-react/styles.css";

// 🍻 https://react-hot-toast.com/docs/toast
import toast, { Toaster } from "react-hot-toast";

import awsExports from "./aws-exports";
Amplify.configure(awsExports);

const TOAST_SETTINGS = {
  duration: 3000,
  position: "top-right",
  // Custom Icon
  icon: "👏",
  // Change colors of success/error/loading icon
  iconTheme: {
    primary: "#000",
    secondary: "#fff",
  },
  // Aria
  ariaProps: {
    role: "status",
    "aria-live": "polite",
  },
};
const initialState = { name: "", description: "" };

function App({ signOut, user }) {
  const [formState, setFormState] = useState(initialState);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const todoSubscription = DataStore.observe(Todo).subscribe(async () => {
      try {
        fetchTodos();
      } catch (err) {
        console.error("todoSubscription error", err);
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
    try {
      await DataStore.clear();
      fetchTodos();
    } catch (err) {
      console.error("error clearing DataStore", err);
    }
  }

  const notify = (msg, type = "success", options) => {
    switch (type) {
      case "success":
        toast.success(msg, {
          duration: options?.duration || TOAST_SETTINGS.duration,
          position: options?.position || TOAST_SETTINGS.position,
        });
        break;
      case "error":
        toast.error(msg, {
          duration: options?.duration || TOAST_SETTINGS.duration,
          position: options?.position || TOAST_SETTINGS.position,
        });
        break;
      case "custom":
        toast.error(msg, {
          duration: options?.duration || TOAST_SETTINGS.duration,
          position: options?.position || TOAST_SETTINGS.position,
        });
        break;
      case "loading":
        // this
        break;
      default:
      // intentionally blank
    }
  };

  async function deleteTodo(id) {
    try {
      const todelete = await DataStore.query(Todo, id);
      DataStore.delete(todelete);
      fetchTodos();
      notify(`Done. Deleted Todo #${id}`, "success");
    } catch (err) {
      console.error("error clearing DataStore", err);
    }
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
      {/* controls */}
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

      {/* new todo */}
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

      {/* todos */}
      {todos.map((todo, idx) => (
        <div key={todo.id ? todo.id : idx} style={styles.todo}>
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

      {/* notifications */}
      <Toaster position="top-center" reverseOrder={false} gutter={8} />
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
  notification: {
    container: {
      position: "absolute",
      top: 0,
      right: 0,
    },
  },
  row: { display: "flex", justifyContent: "space-between" },
};

export default withAuthenticator(App);
