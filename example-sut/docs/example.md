# Example documentation

This is an example of a test suite written in Phrasé.

```phrasé
when I visit "http://localhost:3000"
and I type "user01" on login form login field
and I type "password" on password field
and I click on login form confirm button
then welcome message should be visible
and it should have text "Welcome, user01!"
and login form should not exist
```

You can have multiple test cases in a single document. Here is a second one :

```phrasé
when I visit "http://localhost:3000"
and I type "user01" on login form login field
and I click on login form confirm button
then login error message should be visible
and it should have text "Please enter a username and password"
```
