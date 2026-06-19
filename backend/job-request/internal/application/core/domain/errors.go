package domain

import "errors"

// ErrNotFound is returned by the DB port when a requested entity does not exist.
// The application core maps this to codes.NotFound.
var ErrNotFound = errors.New("not found")
