#!/usr/local/bin/perl
  
my $pp = qr/^\W* (?: (\w) (?0) \g{-1} | \w? ) \W*$/ix;
for $s ( "saippuakauppias", "A man, a plan, a canal: Panama!", "mom", "123321" ){
  print "'$s' is a palindrome\n" if $s =~ /$pp/;
}
