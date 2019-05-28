
set updatetime=250

autocmd CursorHold * update
autocmd CursorHold,CursorHoldI * update

nnoremap 47756010111050133225314050746578 :
inoremap 47756010111050133225314050746578 <Esc>:
vnoremap 47756010111050133225314050746578 :
xnoremap 47756010111050133225314050746578 :
snoremap 47756010111050133225314050746578 :
cnoremap 47756010111050133225314050746578 :

let g:last = ""
let g:last = 0
function! SaveBuffer()
  if g:last !=# @@
    call writefile(split(@@, "\n", 1), "/home/web_user/data/yank_buffer")
  endif

  let g:last = @@

endfunction


autocmd CursorHold,CursorHoldI,CursorMoved,CursorMovedI <buffer> call SaveBuffer()
