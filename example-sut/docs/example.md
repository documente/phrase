# Example documentation

This is an example of a test suite written in Phrasé.

```phrasé
when I visit "http://localhost:3000"
and I type "password" on login form password field
and I click on login form confirm button
then login error message should be visible
and it should have text "Please enter a username and password"
done
```

You can have multiple test cases in a single document. Here is a second one:

```phrasé
when I visit "http://localhost:3000"
and I type "user01" on login form login field
and I click on login form confirm button
then login error message should be visible
and it should have text "Please enter a username and password"
done
```

You can also have reusable blocks such as these:

```phrasé
In order to login:
- I visit "http://localhost:3000"
- I type "user01" on login form login field
- I type "password" on password field
- I click on login form confirm button
done
```

```phrasé
In order to add a task with title {{title}}:
- I type "{{title}}" on new task title field
- I click on add task button
done
```

You can use these blocks in your test cases like this:

```phrasé
when I login
then welcome message should be visible
and it should have text "Welcome, user01!"
and login form should not exist
done
```

You can call external functions like in this test:

```phrasé
given task list is empty
when I login
then task list should have 0 task
done
```

You can also have a mix of test cases and reusable blocks in a single code block:

```phrasé
given task list is empty
and I login
and I add a task with title "Buy milk"
when I click on task with text "Buy milk" delete button
then task list should have 0 task
done

for $element to have {{count}} task:
- its children should have length {{count}}
done
```
