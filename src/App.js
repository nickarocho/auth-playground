import React, { useEffect, useState } from "react";
import { DataStore, I18n } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { Todo } from "./models";
import "@aws-amplify/ui-react/styles.css";

// 🍻 https://react-hot-toast.com/docs/toast
import toast, { Toaster } from "react-hot-toast";

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

I18n.putVocabulariesForLanguage("en", {
  "Create Account": "Register",
  "Create a new account": "New User",
  "Confirm Password": "Type it again...",
  Email: "What's your email?",
  "Phone Number": "And a good phone number?",
});

function App({ signOut, user }) {
  console.log({ user });
  const [formState, setFormState] = useState(initialState);
  const [todos, setTodos] = useState([]);
  const [currentlyEditing, setCurrentlyEditing] = useState([]);
  const [editedDrafts, setEditedDrafts] = useState([]);

  useEffect(() => {
    const todoSubscription = DataStore.observe(Todo).subscribe(async (msg) => {
      try {
        await fetchTodos();
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
      setTodos(todos.reverse());
    } catch (err) {
      notify(`Hmm... something went wrong 🤔`, "error");
      console.error("error fetching todos", err);
    }
  }

  async function clearTodos() {
    try {
      await DataStore.clear();
      fetchTodos();
      notify(`Done. Cleared the local store (refresh to re-sync).`, "success");
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
        // TODO: this
        break;
      default:
      // intentionally blank
    }
  };

  async function deleteTodo(id) {
    try {
      if (!id) {
        throw new Error("no ID passed to delete this specific model instance");
      }

      const todelete = await DataStore.query(Todo, id);
      await DataStore.delete(todelete);
      fetchTodos();
      notify(`Done. Deleted Todo #${id}`, "success");
    } catch (err) {
      notify(`Hmm... something went wrong 🤔`, "error");
      console.error(err);
    }
  }

  async function editTodo(todo) {
    try {
      if (!todo.id) {
        throw new Error("no ID passed to edit this specific model instance");
      }

      // toggle UI to edit this instance
      setCurrentlyEditing([...currentlyEditing, todo.id]);
      setEditedDrafts([
        ...editedDrafts,
        {
          id: todo.id,
          name: todo.name,
          description: todo.description,
        },
      ]);
    } catch (err) {
      notify(`Hmm... something went wrong 🤔`, "error");
      console.error(err);
    }
  }

  function handleEditChange(todoId, key, value) {
    const updatedDrafts = [...editedDrafts].map((draft) => {
      if (draft.id === todoId) {
        return {
          ...draft,
          [key]: value,
        };
      } else {
        return draft;
      }
    });

    setEditedDrafts([...updatedDrafts]);
  }

  function discardChanges(id) {
    if (!id) {
      notify(`Hmm... something went wrong 🤔`, "error");
      throw new Error("no ID passed to discardChanges");
    }

    // remove ID from array of those being currently edited
    const index = currentlyEditing.indexOf(id);
    currentlyEditing.splice(index, 1);

    // refresh state
    setCurrentlyEditing([...currentlyEditing]);
    // TODO: without this, the app could have a "soft-save" feature
    setEditedDrafts(editedDrafts.filter((draft) => draft.id !== id));
  }

  async function saveChanges(id) {
    try {
      if (!id) {
        notify(`Hmm... something went wrong 🤔`, "error");
        throw new Error("no ID passed to saveChanges");
      }

      const original = await DataStore.query(Todo, id);
      const modified = editedDrafts.find((draft) => draft.id === id);

      // remove added ID property to avoid collision
      delete modified.id;

      await DataStore.save(
        Todo.copyOf(original, (updated) => {
          Object.assign(updated, modified);
        })
      );

      fetchTodos();
      notify(`The changes have been saved! 👍`, "success");
      discardChanges(id);
    } catch (err) {
      notify(`Hmm... something went wrong saving your changes 🤔`, "error");
      console.error(err);
    }
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) {
        notify(
          `Missing the name or description. Add those and try again.`,
          "error"
        );
        return;
      }

      const todo = { ...formState };
      await DataStore.save(new Todo(todo));

      notify(`Done.`, "success");
      setTodos([...todos, todo]);
      setFormState(initialState);
    } catch (err) {
      notify(`Hmm, something went wrong.`, "error");
      console.error("error creating todo:", err);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.user}>
        Signed in as <strong>{user.username}</strong>
      </div>
      {/* controls */}
      <div style={styles.row}>
        <button
          style={styles.button}
          onClick={() => {
            DataStore.clear();
            signOut();
          }}
        >
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
      {todos.map((todo, idx) => {
        const isBeingEdited = currentlyEditing.includes(todo.id);
        const editedDraft = editedDrafts.find((draft) => draft.id === todo.id);

        return (
          <div key={todo.id ? todo.id : idx} style={styles.todo}>
            {isBeingEdited && editedDraft ? (
              <>
                <input
                  onChange={(event) =>
                    handleEditChange(todo.id, "name", event.target.value)
                  }
                  style={styles.todoNameEditing}
                  value={editedDraft.name}
                  placeholder="Name"
                />
                <input
                  onChange={(event) =>
                    handleEditChange(todo.id, "description", event.target.value)
                  }
                  style={styles.todoDescriptionEditing}
                  value={editedDraft.description}
                  placeholder="Description"
                />
              </>
            ) : (
              <>
                <p style={styles.todoName}>{todo.name}</p>
                <p style={styles.todoDescription}>{todo.description}</p>
              </>
            )}
            <div style={styles.todo.controlsWrapper}>
              {isBeingEdited ? (
                <>
                  <p
                    data-todoid={todo.id}
                    onClick={() => saveChanges(todo.id)}
                    style={styles.todoEdit}
                  >
                    Save Changes
                  </p>
                  <p
                    data-todoid={todo.id}
                    onClick={() => discardChanges(todo.id)}
                    style={styles.todoDelete}
                  >
                    Discard Changes
                  </p>
                </>
              ) : (
                <>
                  <p
                    data-todoid={todo.id}
                    onClick={() => editTodo(todo)}
                    style={styles.todoEdit}
                  >
                    Edit
                  </p>
                  <p
                    data-todoid={todo.id}
                    onClick={() => deleteTodo(todo.id)}
                    style={styles.todoDelete}
                  >
                    Delete
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })}

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
  todo: {
    marginBottom: 15,
    controlsWrapper: {
      display: "flex",
      paddingTop: ".5rem",
    },
  },
  input: {
    border: "none",
    backgroundColor: "#ddd",
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  todoName: { fontSize: 20, fontWeight: "bold" },
  // TODO: this CSS system is trash... need classes
  todoNameEditing: { fontSize: 20, fontWeight: "bold", marginTop: "20px" },
  todoDescription: { marginBottom: 0 },
  todoDescriptionEditing: { marginBottom: 0, marginTop: "16px" },
  todoDelete: {
    fontSize: ".7rem",
    textDecoration: "none",
    textTransform: "uppercase",
    cursor: "pointer",
    color: "red",
    fontWeight: 700,
  },
  todoEdit: {
    fontSize: ".7rem",
    textDecoration: "none",
    textTransform: "uppercase",
    cursor: "pointer",
    color: "#006faa",
    fontWeight: 700,
    paddingRight: "1rem",
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
  user: {
    margin: "1rem 0",
  },
  row: { display: "flex", justifyContent: "space-between" },
};

export default withAuthenticator(App);
