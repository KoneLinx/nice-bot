
// wordexp

#pragma region H

/* Copyright (C) 1991-2020 Free Software Foundation, Inc.
   This file was part of the GNU C Library.

   The GNU C Library is free software; you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public
   License as published by the Free Software Foundation; either
   version 2.1 of the License, or (at your option) any later version.

   The GNU C Library is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   Lesser General Public License for more details.

   You should have received a copy of the GNU Lesser General Public
   License along with the GNU C Library; if not, see
   <https://www.gnu.org/licenses/>.  */


#ifndef INCLUDE_WORDEXP_
#define INCLUDE_WORDEXP_

#define __need_size_t
#include <cstddef>


   /* Bits set in the FLAGS argument to `wordexp'.  */
enum
{
    WRDE_DOOFFS = (1 << 0),	/* Insert PWORDEXP->we_offs NULLs.  */
    WRDE_APPEND = (1 << 1),	/* Append to results of a previous call.  */
    WRDE_NOCMD = (1 << 2),	/* Don't do command substitution.  */
    WRDE_REUSE = (1 << 3),	/* Reuse storage in PWORDEXP.  */
    WRDE_SHOWERR = (1 << 4),	/* Don't redirect stderr to /dev/null.  */
    WRDE_UNDEF = (1 << 5),	/* Error for expanding undefined variables.  */
    __WRDE_FLAGS = (WRDE_DOOFFS | WRDE_APPEND | WRDE_NOCMD
    | WRDE_REUSE | WRDE_SHOWERR | WRDE_UNDEF)
};


/* Structure describing a word-expansion run.  */
typedef struct
{
    size_t we_wordc;		/* Count of words matched.  */
    char** we_wordv;		/* List of expanded words.  */
    size_t we_offs;		/* Slots to reserve in `we_wordv'.  */
} wordexp_t;


/* Possible nonzero return values from `wordexp'.  */
enum
{
    //#ifdef __USE_XOPEN
    //    WRDE_NOSYS = -1,		/* Never used since we support `wordexp'.  */
    //#endif
    WRDE_NOSPACE = 1,		/* Ran out of memory.  */
    WRDE_BADCHAR,		/* A metachar appears in the wrong place.  */
    WRDE_BADVAL,		/* Undefined var reference with WRDE_UNDEF.  */
    WRDE_CMDSUB,		/* Command substitution with WRDE_NOCMD.  */
    WRDE_SYNTAX			/* Shell syntax error.  */
};

/* Do word expansion of WORDS into PWORDEXP.  */
extern int wordexp(const char* __words, wordexp_t* __pwordexp, int __flags = 0);

/* Free the storage allocated by a `wordexp' call.  */
extern void wordfree(wordexp_t* __pwordexp);


#endif // !INCLUDE_WORDEXP_


#pragma endregion

#pragma region CPP
/* Copyright (C) 2020 Konelinx
   This file is part of MY_LIBRARY

   MY_LIBRARY is licenced under the same terms as the original source.
   GNU Lesser General Public Licence version 2.1, or (at your option) any later version.

   You should have received a copy of the GNU Lesser General Public
   License along with MY_LIBRARY; If not, see
   <https://www.gnu.org/licenses/>.
*/

/* Copyright (C) 1991-2020 Free Software Foundation, Inc.
   This file was part of the GNU C Library.

   The GNU C Library is free software; you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public
   License as published by the Free Software Foundation; either
   version 2.1 of the License, or (at your option) any later version.

   The GNU C Library is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   Lesser General Public License for more details.

   You should have received a copy of the GNU Lesser General Public
   License along with the GNU C Library; if not, see
   <https://www.gnu.org/licenses/>.  */


#include "wordexp.h"

#include <cassert>
#include <cstring>
#include <algorithm>

/* The w_*() functions manipulate word lists. */

#define W_CHUNK	(100)

/* Result of w_newword will be ignored if it's the last word. */
static inline char*
w_newword(size_t* actlen, size_t* maxlen)
{
	*actlen = *maxlen = 0;
	return nullptr;
}

static char*
w_addchar(char* buffer, size_t* actlen, size_t* maxlen, char ch)
/* (lengths exclude trailing zero) */
{
	/* Add a character to the buffer, allocating room for it if needed.  */

	if (*actlen == *maxlen)
	{
		char* old_buffer = buffer;
		assert(buffer == nullptr || *maxlen != 0);
		*maxlen += W_CHUNK;
		buffer = (char*)realloc(buffer, 1 + *maxlen);

		if (buffer == nullptr)
			free(old_buffer);
	}

	if (buffer != nullptr)
	{
		buffer[*actlen] = ch;
		buffer[++(*actlen)] = '\0';
	}

	return buffer;
}

static char*
w_addmem(char* buffer, size_t* actlen, size_t* maxlen, const char* str,
	size_t len)
{
	/* Add a string to the buffer, allocating room for it if needed.
	 */
	if (*actlen + len > * maxlen)
	{
		char* old_buffer = buffer;
		assert(buffer == nullptr || *maxlen != 0);
		*maxlen += std::max(2 * len, (decltype(len))W_CHUNK);
		buffer = (char*)realloc(old_buffer, 1 + *maxlen);

		if (buffer == nullptr)
			free(old_buffer);
	}

	if (buffer != nullptr)
	{
		*((char*)memcpy(&buffer[*actlen], str, len)) = '\0';
		*actlen += len;
	}

	return buffer;
}

static char*
w_addstr(char* buffer, size_t* actlen, size_t* maxlen, const char* str)
/* (lengths exclude trailing zero) */
{
	/* Add a string to the buffer, allocating room for it if needed.
	 */
	size_t len;

	assert(str != nullptr); /* w_addstr only called from this file */
	len = strlen(str);

	return w_addmem(buffer, actlen, maxlen, str, len);
}

static int
w_addword(wordexp_t* pwordexp, char* word)
{
	/* Add a word to the wordlist */
	size_t num_p;
	char** new_wordv;
	bool allocated = false;

	/* Internally, nullptr acts like "".  Convert nullptrs to "" before
	 * the caller sees them.
	 */
	if (word == nullptr)
	{
		word = _strdup("");
		if (word == nullptr)
			goto no_space;
		allocated = true;
	}

	num_p = 2 + pwordexp->we_wordc + pwordexp->we_offs;
	new_wordv = (char**)realloc(pwordexp->we_wordv, sizeof(char*) * num_p);
	if (new_wordv != nullptr)
	{
		pwordexp->we_wordv = new_wordv;
		pwordexp->we_wordv[pwordexp->we_offs + pwordexp->we_wordc++] = word;
		pwordexp->we_wordv[pwordexp->we_offs + pwordexp->we_wordc] = nullptr;
		return 0;
	}

	if (allocated)
		free(word);

no_space:
	return WRDE_NOSPACE;
}


/* The parse_*() functions should leave *offset being the offset in 'words'
 * to the last character processed.
 */

static int
parse_backslash(char** word, size_t* word_length, size_t* max_length,
	const char* words, size_t* offset)
{
	/* We are poised _at_ a backslash, not in quotes */

	switch (words[1 + *offset])
	{
	case 0:
		/* Backslash is last character of input words */
		return WRDE_SYNTAX;

	case '\n':
		++(*offset);
		break;

	default:
		*word = w_addchar(*word, word_length, max_length, words[1 + *offset]);
		if (*word == nullptr)
			return WRDE_NOSPACE;

		++(*offset);
		break;
	}

	return 0;
}

static int
parse_qtd_backslash(char** word, size_t* word_length, size_t* max_length,
	const char* words, size_t* offset)
{
	/* We are poised _at_ a backslash, inside quotes */

	switch (words[1 + *offset])
	{
	case 0:
		/* Backslash is last character of input words */
		return WRDE_SYNTAX;

	case '\n':
		++(*offset);
		break;

		//case '$':
		//case '`':
	case '"':
	case '\\':
		*word = w_addchar(*word, word_length, max_length, words[1 + *offset]);
		if (*word == nullptr)
			return WRDE_NOSPACE;

		++(*offset);
		break;

	default:
		*word = w_addchar(*word, word_length, max_length, words[*offset]);
		if (*word != nullptr)
			*word = w_addchar(*word, word_length, max_length, words[1 + *offset]);

		if (*word == nullptr)
			return WRDE_NOSPACE;

		++(*offset);
		break;
	}

	return 0;
}

static int
parse_squote(char** word, size_t* word_length, size_t* max_length,
	const char* words, size_t* offset)
{
	/* We are poised just after a single quote */
	for (; words[*offset]; ++(*offset))
	{
		if (words[*offset] != '\'')
		{
			*word = w_addchar(*word, word_length, max_length, words[*offset]);
			if (*word == nullptr)
				return WRDE_NOSPACE;
		}
		else return 0;
	}

	/* Unterminated string */
	return WRDE_SYNTAX;
}


static int
parse_dquote(char** word, size_t* word_length, size_t* max_length,
	const char* words, size_t* offset, int flags,
	wordexp_t* pwordexp, const char* ifs, const char* ifs_white)
{
	/* We are poised just after a double-quote */
	int error;

	for (; words[*offset]; ++(*offset))
	{
		switch (words[*offset])
		{
		case '"':
			return 0;

			/*			We do not support dollar expasion yet
		case '$':
			error = parse_dollars(word, word_length, max_length, words, offset,
				flags, pwordexp, ifs, ifs_white, 1);
			/* The ``1'' here is to tell parse_dollars not to
			 * split the fields.  It may need to, however ("$@").
			 *
			if (error)
				return error;

			break;
			*/

			/*			We do not support backtick expansion yet
		case '`':
			++(*offset);
			error = parse_backtick(word, word_length, max_length, words,
				offset, flags, nullptr, nullptr, nullptr);
			/* The first nullptr here is to tell parse_backtick not to
			 * split the fields.
			 *
			if (error)
				return error;

			break;
			*/

		case '\\':
			error = parse_qtd_backslash(word, word_length, max_length, words,
				offset);

			if (error)
				return error;

			break;

		default:
			*word = w_addchar(*word, word_length, max_length, words[*offset]);
			if (*word == nullptr)
				return WRDE_NOSPACE;
		}
	}

	/* Unterminated string */
	return WRDE_SYNTAX;
}


/*
 * wordfree() is to be called after pwordexp is finished with.
 */

void
wordfree(wordexp_t* pwordexp)
{

	/* wordexp can set pwordexp to nullptr */
	if (pwordexp && pwordexp->we_wordv)
	{
		char** wordv = pwordexp->we_wordv;

		for (wordv += pwordexp->we_offs; *wordv; ++wordv)
			free(*wordv);

		free(pwordexp->we_wordv);
		pwordexp->we_wordv = nullptr;
	}
}
// ??? libc_hidden_def(wordfree)


/*
 * wordexp()
 */

int
wordexp(const char* words, wordexp_t* pwordexp, int flags)
{
	size_t words_offset;
	size_t word_length;
	size_t max_length;
	char* word = w_newword(&word_length, &max_length);
	int error;
	char* ifs;
	char ifs_white[4];
	wordexp_t old_word = *pwordexp;

	if (flags & WRDE_REUSE)
	{
		/* Minimal implementation of WRDE_REUSE for now */
		wordfree(pwordexp);
		old_word.we_wordv = nullptr;
	}

	if ((flags & WRDE_APPEND) == 0)
	{
		pwordexp->we_wordc = 0;

		if (flags & WRDE_DOOFFS)
		{
			pwordexp->we_wordv = (char**)calloc(1 + pwordexp->we_offs, sizeof(char*));
			if (pwordexp->we_wordv == nullptr)
			{
				error = WRDE_NOSPACE;
				goto do_error;
			}
		}
		else
		{
			pwordexp->we_wordv = (char**)calloc(1, sizeof(char*));
			if (pwordexp->we_wordv == nullptr)
			{
				error = WRDE_NOSPACE;
				goto do_error;
			}

			pwordexp->we_offs = 0;
		}
	}

	/* Find out what the field separators are.
	 * There are two types: whitespace and non-whitespace.
	 */
	 //ifs = getenv("IFS");
	ifs = nullptr;

	if (ifs == nullptr)
		/* IFS unset - use <space><tab><newline>. */
		/*ifs =*/ strcpy_s(ifs_white, " \t\n");
	else
	{
		char* ifsch = ifs;
		char* whch = ifs_white;

		while (*ifsch != '\0')
		{
			if (*ifsch == ' ' || *ifsch == '\t' || *ifsch == '\n')
			{
				/* Whitespace IFS.  See first whether it is already in our
			   collection.  */
				char* runp = ifs_white;

				while (runp < whch && *runp != *ifsch)
					++runp;

				if (runp == whch)
					*whch++ = *ifsch;
			}

			++ifsch;
		}
		*whch = '\0';
	}

	for (words_offset = 0; words[words_offset]; ++words_offset)
		switch (words[words_offset])
		{
		case '\\':
			error = parse_backslash(&word, &word_length, &max_length, words,
				&words_offset);

			if (error)
				goto do_error;

			break;

			/*			We don't support dollar expansion yet
		case '$':
			error = parse_dollars(&word, &word_length, &max_length, words,
				&words_offset, flags, pwordexp, ifs, ifs_white,
				0);

			if (error)
				goto do_error;

			break;
			*/

			/*			we don't support backtick expasion yet
		case '`':
			++words_offset;
			error = parse_backtick(&word, &word_length, &max_length, words,
				&words_offset, flags, pwordexp, ifs,
				ifs_white);

			if (error)
				goto do_error;

			break;
			*/

		case '"':
			++words_offset;
			error = parse_dquote(&word, &word_length, &max_length, words,
				&words_offset, flags, pwordexp, ifs, ifs_white);

			if (error)
				goto do_error;

			if (!word_length)
			{
				error = w_addword(pwordexp, nullptr);

				if (error)
					return error;
			}

			break;

		case '\'':
			++words_offset;
			error = parse_squote(&word, &word_length, &max_length, words,
				&words_offset);

			if (error)
				goto do_error;

			if (!word_length)
			{
				error = w_addword(pwordexp, nullptr);

				if (error)
					return error;
			}

			break;

			/*		We don't support tilde expansion
		case '~':
			error = parse_tilde(&word, &word_length, &max_length, words,
				&words_offset, pwordexp->we_wordc);

			if (error)
				goto do_error;

			break;
			*/

			/*     We don't support globbing yet
		case '*':
		case '[':
		case '?':
			error = parse_glob(&word, &word_length, &max_length, words,
				&words_offset, flags, pwordexp, ifs, ifs_white);

			if (error)
				goto do_error;

			break;
			*/

		default:
			/* Is it a word separator? */
			if (strchr(" \t", words[words_offset]) == nullptr)
			{
				char ch = words[words_offset];

				/* Not a word separator -- but is it a valid word char? */
				/*			We chose these characters to be valid
				if (strchr("\n|&;<>(){}", ch))
				{
					// Fail
					error = WRDE_BADCHAR;
					goto do_error;
				}
				*/

				/* "Ordinary" character -- add it to word */
				word = w_addchar(word, &word_length, &max_length,
					ch);
				if (word == nullptr)
				{
					error = WRDE_NOSPACE;
					goto do_error;
				}

				break;
			}

			/* If a word has been delimited, add it to the list. */
			if (word != nullptr)
			{
				error = w_addword(pwordexp, word);
				if (error)
					goto do_error;
			}

			word = w_newword(&word_length, &max_length);
		}

	/* End of string */

	/* There was a word separator at the end */
	if (word == nullptr) /* i.e. w_newword */
		return 0;

	/* There was no field separator at the end */
	return w_addword(pwordexp, word);

do_error:
	/* Error:
	 *	free memory used (unless error is WRDE_NOSPACE), and
	 *	set pwordexp members back to what they were.
	 */

	free(word);

	if (error == WRDE_NOSPACE)
		return WRDE_NOSPACE;

	if ((flags & WRDE_APPEND) == 0)
		wordfree(pwordexp);

	*pwordexp = old_word;
	return error;
}

#pragma endregion


//#include "./wordexp.h"
#include <cstdint>
#include <node.h>


namespace demo
{

	void WordExp(const v8::FunctionCallbackInfo< v8::Value >& args)
	{
		v8::Isolate* isolate = args.GetIsolate();

		wordexp_t e;

		v8::String::Utf8Value input(isolate, args[0]);

		int error = wordexp(*input, &e, 0);

		if (error)
		{
			auto str = std::to_string(error);
			isolate->ThrowException(v8::Exception::TypeError(
				v8::String::NewFromUtf8(isolate, str.c_str() ).ToLocalChecked()));
			return;
		}



		auto* arr = new v8::Local<v8::Value>[e.we_wordc];

		for (unsigned i{}; i < e.we_wordc; ++i)
		{
			auto local = v8::String::Empty(isolate);
			v8::String::NewFromUtf8(isolate, e.we_wordv[i]).ToLocal(&local);
			arr[i] = local.As<v8::Value>();
		}

		auto array{ v8::Array::New(isolate, arr, e.we_wordc) };

		args.GetReturnValue().Set(array);

		delete[] arr;
		wordfree(&e);
	}

	void Init(v8::Local<v8::Object> exports)
	{
		NODE_SET_METHOD(exports, "wordexp", WordExp);
	}

	NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

};